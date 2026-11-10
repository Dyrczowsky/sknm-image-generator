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
