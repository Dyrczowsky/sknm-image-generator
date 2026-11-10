import type { NewHistoryEntry } from '../../src/types'
import type { Env } from './env'

const ASSETS_BUCKET = 'sknm-poster-assets'
const IMAGES_BUCKET = 'sknm-ai-images'

// Komunikaty błędów nigdy nie zawierają klucza ani treści odpowiedzi z nagłówkami.
async function failure(what: string, res: Response): Promise<Error> {
  const body = (await res.text().catch(() => '')).slice(0, 200)
  return new Error(`Supabase: ${what} nie powiodło się (HTTP ${res.status})${body ? `: ${body}` : ''}`)
}

export function supabase(env: Env, fetchImpl: typeof fetch = fetch) {
  const base = env.SUPABASE_URL.replace(/\/+$/, '')
  const auth = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
  // Ukryj klucz także gdyby treść odpowiedzi go zawierała.
  const scrub = (e: Error) => new Error(e.message.split(env.SUPABASE_SERVICE_ROLE_KEY).join('***'))

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
    async uploadAsset(ref: string, bytes: Uint8Array, mime: string): Promise<void> {
      const res = await upload(ASSETS_BUCKET, ref, bytes, mime)
      if (res.ok || res.status === 409) return
      const text = await res.clone().text().catch(() => '')
      if (res.status === 400 && /already exists|Duplicate/i.test(text)) return
      throw scrub(await failure('zapis zdjęcia', res))
    },

    async uploadImage(path: string, png: Uint8Array): Promise<string> {
      const res = await upload(IMAGES_BUCKET, path, png, 'image/png')
      if (!res.ok) throw scrub(await failure('zapis obrazu', res))
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
      if (!res.ok) throw scrub(await failure('zapis historii', res))
      const rows = (await res.json()) as { id: number }[]
      return rows[0].id
    },
  }
}
