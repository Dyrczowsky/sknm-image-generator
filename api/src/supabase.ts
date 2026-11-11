import type { NewHistoryEntry } from '../../src/types'
import type { Env } from './env'
import type { Mime } from './photos'

const ASSETS_BUCKET = 'sknm-poster-assets'
const IMAGES_BUCKET = 'sknm-ai-images'

// Komunikat zawiera status i początek treści odpowiedzi (po wycięciu klucza), nigdy nagłówki.
async function failure(what: string, res: Response, key: string): Promise<Error> {
  let body = await res.text().catch(() => '')
  if (key) body = body.split(key).join('***')
  body = body.slice(0, 200)
  return new Error(`Supabase: ${what} nie powiodło się (HTTP ${res.status})${body ? `: ${body}` : ''}`)
}

const REF_RE = /^[0-9a-f]{64}\.(jpg|png)$/
const IMAGE_PATH_RE = /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.png$/

export function supabase(env: Env, fetchImpl: typeof fetch = fetch) {
  const base = env.SUPABASE_URL.replace(/\/+$/, '')
  const auth = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }

  async function upload(bucket: string, name: string, bytes: Uint8Array, mime: string): Promise<Response> {
    try {
      return await fetchImpl(`${base}/storage/v1/object/${bucket}/${name}`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': mime, 'x-upsert': 'false' },
        body: bytes,
      })
    } catch {
      throw new Error('Supabase: błąd sieci przy wysyłaniu pliku')
    }
  }

  return {
    // Ten sam skrót = ta sama treść, więc „już istnieje" oznacza sukces.
    async uploadAsset(ref: string, bytes: Uint8Array, mime: Mime): Promise<void> {
      if (!REF_RE.test(ref) || ref.endsWith(mime === 'image/png' ? '.jpg' : '.png')) throw new Error('Supabase: nieprawidłowa nazwa zdjęcia')
      const res = await upload(ASSETS_BUCKET, ref, bytes, mime)
      if (res.ok || res.status === 409) return
      const text = await res.clone().text().catch(() => '')
      if (res.status === 400 && /already exists|Duplicate/i.test(text)) return
      throw await failure('zapis zdjęcia', res, env.SUPABASE_SERVICE_ROLE_KEY)
    },

    async uploadImage(path: string, png: Uint8Array): Promise<string> {
      if (!IMAGE_PATH_RE.test(path)) throw new Error('Supabase: nieprawidłowa ścieżka obrazu')
      const res = await upload(IMAGES_BUCKET, path, png, 'image/png')
      if (!res.ok) throw await failure('zapis obrazu', res, env.SUPABASE_SERVICE_ROLE_KEY)
      return `${base}/storage/v1/object/public/${IMAGES_BUCKET}/${path}`
    },

    // Wpis w bibliotece grafik (`sknm_assets`); ten sam plik już wpisany = sukces.
    async registerAsset(ref: string, name: string): Promise<void> {
      if (!REF_RE.test(ref)) throw new Error('Supabase: nieprawidłowa nazwa zdjęcia')
      let res: Response
      try {
        res = await fetchImpl(`${base}/rest/v1/sknm_assets?on_conflict=ref`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' },
          body: JSON.stringify({ ref, kind: 'photo', name: name.slice(0, 120), source: 'ai', author_email: 'AI' }),
        })
      } catch {
        throw new Error('Supabase: błąd sieci przy zapisie do biblioteki')
      }
      if (!res.ok) throw await failure('zapis do biblioteki', res, env.SUPABASE_SERVICE_ROLE_KEY)
    },

    async listAssets(): Promise<{ ref: string; kind: string; name: string; created_at: string }[]> {
      let res: Response
      try {
        res = await fetchImpl(`${base}/rest/v1/sknm_assets?select=ref,kind,name,created_at&kind=eq.photo&order=created_at.desc&limit=200`, { headers: auth })
      } catch {
        throw new Error('Supabase: błąd sieci przy odczycie biblioteki')
      }
      if (!res.ok) throw await failure('odczyt biblioteki', res, env.SUPABASE_SERVICE_ROLE_KEY)
      return (await res.json()) as { ref: string; kind: string; name: string; created_at: string }[]
    },

    // Bajty grafiki z biblioteki; `null` = nie ma takiego pliku.
    async downloadAsset(ref: string): Promise<Uint8Array | null> {
      if (!REF_RE.test(ref)) return null
      let res: Response
      try {
        res = await fetchImpl(`${base}/storage/v1/object/${ASSETS_BUCKET}/${ref}`, { headers: auth })
      } catch {
        throw new Error('Supabase: błąd sieci przy pobieraniu zdjęcia z biblioteki')
      }
      if (res.status === 400 || res.status === 404) return null
      if (!res.ok) throw await failure('pobranie zdjęcia z biblioteki', res, env.SUPABASE_SERVICE_ROLE_KEY)
      return new Uint8Array(await res.arrayBuffer())
    },

    async insertHistory(row: NewHistoryEntry & { source: 'ai'; image_url: string }): Promise<number> {
      let res: Response
      try {
        res = await fetchImpl(`${base}/rest/v1/sknm_poster_history`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify(row),
        })
      } catch {
        throw new Error('Supabase: błąd sieci przy zapisie historii')
      }
      if (!res.ok) throw await failure('zapis historii', res, env.SUPABASE_SERVICE_ROLE_KEY)
      let id: unknown
      try {
        id = ((await res.json()) as { id?: unknown }[])[0]?.id
      } catch {
        id = undefined
      }
      if (typeof id !== 'number') throw new Error('Supabase: zapis historii – brak id')
      return id
    },
  }
}
