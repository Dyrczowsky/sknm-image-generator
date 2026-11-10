import type { ApiError } from '../../src/api/types'

export interface PhotoIn { url?: string; data?: string; x?: number; y?: number; zoom?: number }
export type Mime = 'image/jpeg' | 'image/png'
export interface LoadedPhoto { bytes: Uint8Array; mime: Mime; x?: number; y?: number; zoom?: number }
export type LoadResult = { ok: true; photos: LoadedPhoto[] } | { ok: false; error: ApiError }

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const MAX_TOTAL_BYTES = 15 * 1024 * 1024
const MAX_PHOTOS = 6
const FETCH_TIMEOUT_MS = 10_000

function fail(code: ApiError['code'], message: string): { ok: false; error: ApiError } {
  return { ok: false, error: { code, message } }
}

// Typ z pierwszych bajtów, nigdy z deklaracji.
function sniffMime(b: Uint8Array): Mime | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  return null
}

function decodeBase64(data: string): Uint8Array | null {
  const raw = data.startsWith('data:') ? data.slice(data.indexOf(',') + 1) : data
  try {
    const bin = atob(raw.replace(/\s+/g, ''))
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

export function toDataUrl(bytes: Uint8Array, mime: Mime): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${mime};base64,${btoa(bin)}`
}

async function readBounded(res: Response, n: number): Promise<Uint8Array | ApiError> {
  const tooLarge: ApiError = { code: 'photo_too_large', message: `Zdjęcie ${n} jest większe niż 5 MB.` }
  const declared = Number(res.headers.get('content-length'))
  if (declared > MAX_PHOTO_BYTES) return tooLarge
  const reader = res.body?.getReader()
  if (!reader) {
    const whole = new Uint8Array(await res.arrayBuffer())
    return whole.length > MAX_PHOTO_BYTES ? tooLarge : whole
  }
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > MAX_PHOTO_BYTES) {
      await reader.cancel()
      return tooLarge
    }
    chunks.push(value)
  }
  const out = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

async function fetchBytes(url: string, n: number, fetchImpl: typeof fetch): Promise<Uint8Array | ApiError> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { code: 'bad_request', message: `Zdjęcie ${n}: nieprawidłowy adres URL.` }
  }
  if (parsed.protocol !== 'https:') return { code: 'bad_request', message: `Zdjęcie ${n}: dozwolone są tylko adresy https.` }
  try {
    const res = await fetchImpl(parsed.href, { redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) return { code: 'photo_fetch_failed', message: `Zdjęcie ${n}: nie udało się pobrać (HTTP ${res.status}).` }
    return await readBounded(res, n)
  } catch {
    return { code: 'photo_fetch_failed', message: `Zdjęcie ${n}: nie udało się pobrać (błąd sieci lub przekroczono 10 s).` }
  }
}

function isApiError(v: Uint8Array | ApiError): v is ApiError {
  return !(v instanceof Uint8Array)
}

export async function loadPhotos(photos: PhotoIn[], fetchImpl: typeof fetch = fetch): Promise<LoadResult> {
  if (photos.length > MAX_PHOTOS) return fail('too_many_photos', `Maksymalnie ${MAX_PHOTOS} zdjęć na wywołanie.`)
  const loaded: LoadedPhoto[] = []
  let total = 0
  for (const [i, p] of photos.entries()) {
    const n = i + 1
    let bytes: Uint8Array | ApiError
    if (p.url !== undefined) bytes = await fetchBytes(p.url, n, fetchImpl)
    else if (p.data !== undefined) {
      bytes = decodeBase64(p.data) ?? { code: 'bad_request', message: `Zdjęcie ${n}: nieprawidłowy base64.` }
      if (!isApiError(bytes) && bytes.length > MAX_PHOTO_BYTES) bytes = { code: 'photo_too_large', message: `Zdjęcie ${n} jest większe niż 5 MB.` }
    } else bytes = { code: 'bad_request', message: `Zdjęcie ${n}: podaj url albo data.` }
    if (isApiError(bytes)) return { ok: false, error: bytes }
    const mime = sniffMime(bytes)
    if (!mime) return fail('photo_not_image', `Zdjęcie ${n} nie jest obrazem JPEG ani PNG.`)
    total += bytes.length
    if (total > MAX_TOTAL_BYTES) return fail('photo_too_large', 'Zdjęcia razem są większe niż 15 MB.')
    loaded.push({ bytes, mime, x: p.x, y: p.y, zoom: p.zoom })
  }
  return { ok: true, photos: loaded }
}
