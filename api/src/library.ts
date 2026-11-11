import type { ApiError } from '../../src/api/types'
import type { Owner } from './auth'
import type { Env } from './env'
import { loadPhotos } from './photos'
import { supabase } from './supabase'

// Biblioteka grafik zespołu (strona „Grafiki" w aplikacji): zapis zdjęcia
// w oryginale i lista zdjęć, których AI może potem użyć jako `{ ref }`.

export interface LibraryDeps { loadPhotos: typeof loadPhotos; supabase: typeof supabase }
const defaultDeps: LibraryDeps = { loadPhotos, supabase }

type Result<T> = { ok: true; value: T } | { ok: false; error: ApiError }
const fail = (code: ApiError['code'], message: string): { ok: false; error: ApiError } => ({ ok: false, error: { code, message } })

const MAX_NAME = 120

// Nazwa pliku jak w aplikacji (src/assets/hash.ts): SHA-256 treści + rozszerzenie.
async function refFor(bytes: Uint8Array, mime: 'image/jpeg' | 'image/png'): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex}.${mime === 'image/png' ? 'png' : 'jpg'}`
}

export async function savePhoto(env: Env, owner: Owner, args: unknown, deps: LibraryDeps = defaultDeps): Promise<Result<{ ref: string; name: string }>> {
  if (typeof args !== 'object' || args === null || Array.isArray(args)) return fail('bad_request', 'Oczekiwano obiektu z polami "name" i "url" albo "data".')
  const { name, url, data, ...rest } = args as Record<string, unknown>
  const extra = Object.keys(rest)
  if (extra.length > 0) return fail('invalid_field', `Niedozwolone pola: ${extra.join(', ')}. Dozwolone: name, url, data.`)
  if (typeof name !== 'string' || name.trim() === '') return fail('invalid_field', 'Pole "name" (nazwa zdjęcia w bibliotece) jest wymagane.')
  if (url === undefined && data === undefined) return fail('bad_request', 'Podaj zdjęcie jako "url" albo "data".')

  const loaded = await deps.loadPhotos([{ url, data } as { url?: string; data?: string }])
  if (!loaded.ok) return loaded
  const { bytes, mime } = loaded.photos[0]
  const ref = await refFor(bytes, mime)
  const clean = name.trim().slice(0, MAX_NAME)
  try {
    const sb = deps.supabase(env)
    await sb.uploadAsset(ref, bytes, mime)
    await sb.registerAsset(ref, clean, owner)
  } catch (e) {
    console.error('library: zapis nie powiódł się:', e instanceof Error ? e.message : 'nieznany błąd')
    return fail('storage_failed', 'Nie udało się zapisać zdjęcia w bibliotece. Spróbuj ponownie za chwilę.')
  }
  return { ok: true, value: { ref, name: clean } }
}

export async function listPhotos(env: Env, deps: LibraryDeps = defaultDeps): Promise<Result<{ ref: string; name: string; created_at: string }[]>> {
  try {
    const rows = await deps.supabase(env).listAssets()
    return { ok: true, value: rows.map(({ ref, name, created_at }) => ({ ref, name, created_at })) }
  } catch (e) {
    console.error('library: odczyt nie powiódł się:', e instanceof Error ? e.message : 'nieznany błąd')
    return fail('storage_failed', 'Nie udało się odczytać biblioteki. Spróbuj ponownie za chwilę.')
  }
}
