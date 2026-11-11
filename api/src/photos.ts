import type { ApiError } from '../../src/api/types'

// `ref` = zdjęcie z biblioteki grafik (nazwa z list_photos).
export interface PhotoIn { url?: string; data?: string; ref?: string; x?: number; y?: number; zoom?: number }
export type LoadRef = (ref: string) => Promise<Uint8Array | null>
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

// Wynik `null` = nieprawidłowy base64, `'too_large'` = za długi ciąg (sprawdzane przed dekodowaniem).
function decodeBase64(data: string): Uint8Array | null | 'too_large' {
  const raw = data.startsWith('data:') ? data.slice(data.indexOf(',') + 1) : data
  if (raw.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 + 1024) return 'too_large'
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

const MAX_REDIRECTS = 3

// Tylko https i tylko nazwy hostów (bez adresów IP i localhost) - dotyczy też każdego przekierowania.
function checkUrl(url: URL, n: number): ApiError | null {
  if (url.protocol !== 'https:') return { code: 'bad_request', message: `Zdjęcie ${n}: dozwolone są tylko adresy https.` }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.startsWith('[') || /^[\d.]+$/.test(host)) {
    return { code: 'bad_request', message: `Zdjęcie ${n}: adres IP i localhost są niedozwolone.` }
  }
  return null
}

async function fetchBytes(url: string, n: number, fetchImpl: typeof fetch): Promise<Uint8Array | ApiError> {
  let current: URL
  try {
    current = new URL(url)
  } catch {
    return { code: 'bad_request', message: `Zdjęcie ${n}: nieprawidłowy adres URL.` }
  }
  const failed: ApiError = { code: 'photo_fetch_failed', message: `Zdjęcie ${n}: nie udało się pobrać (błąd sieci lub przekroczono 10 s).` }
  const deadline = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const bad = checkUrl(current, n)
    if (bad) return bad
    try {
      const res = await fetchImpl(current.href, { redirect: 'manual', signal: deadline })
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        await res.body?.cancel().catch(() => undefined)
        if (!location) return failed
        try {
          current = new URL(location, current)
        } catch {
          return { code: 'bad_request', message: `Zdjęcie ${n}: nieprawidłowe przekierowanie.` }
        }
        continue
      }
      if (!res.ok) return { code: 'photo_fetch_failed', message: `Zdjęcie ${n}: nie udało się pobrać (HTTP ${res.status}).` }
      return await readBounded(res, n)
    } catch {
      return failed
    }
  }
  return { code: 'photo_fetch_failed', message: `Zdjęcie ${n}: za dużo przekierowań.` }
}

function isApiError(v: Uint8Array | ApiError): v is ApiError {
  return !(v instanceof Uint8Array)
}

// Element tablicy z zewnątrz: zwykły obiekt, url/data/ref tylko jako tekst, najwyżej jedno z nich.
function checkItem(p: unknown, n: number): ApiError | null {
  if (typeof p !== 'object' || p === null || Array.isArray(p)) return { code: 'bad_request', message: `Zdjęcie ${n}: oczekiwano obiektu.` }
  const given = (['url', 'data', 'ref'] as const).filter((k) => (p as Record<string, unknown>)[k] !== undefined)
  const wrong = given.find((k) => typeof (p as Record<string, unknown>)[k] !== 'string')
  if (wrong) return { code: 'bad_request', message: `Zdjęcie ${n}: pole "${wrong}" musi być tekstem.` }
  if (given.length > 1) return { code: 'bad_request', message: `Zdjęcie ${n}: podaj tylko jedno z pól url, data, ref.` }
  return null
}

export async function loadPhotos(photos: PhotoIn[], fetchImpl: typeof fetch = fetch, loadRef?: LoadRef): Promise<LoadResult> {
  if (photos.length > MAX_PHOTOS) return fail('too_many_photos', `Maksymalnie ${MAX_PHOTOS} zdjęć na wywołanie.`)
  // Cały kształt sprawdzamy przed pobieraniem czegokolwiek.
  for (const [i, raw] of (photos as unknown[]).entries()) {
    const bad = checkItem(raw, i + 1)
    if (bad) return { ok: false, error: bad }
  }
  // Pobieranie równolegle (6 x 10 s po kolei to za długo); błędy zgłaszamy w kolejności zdjęć.
  const all = await Promise.all((photos as PhotoIn[]).map(async (p, i): Promise<Uint8Array | ApiError> => {
    const n = i + 1
    if (p.url !== undefined) return fetchBytes(p.url, n, fetchImpl)
    if (p.ref !== undefined) {
      const notFound: ApiError = { code: 'photo_fetch_failed', message: `Zdjęcie ${n}: nie ma go w bibliotece (sprawdź list_photos).` }
      const bytes = loadRef ? await loadRef(p.ref).catch(() => null) : null
      return bytes ?? notFound
    }
    if (p.data === undefined) return { code: 'bad_request', message: `Zdjęcie ${n}: podaj url, data albo ref.` }
    const decoded = decodeBase64(p.data)
    if (decoded === 'too_large' || (decoded && decoded.length > MAX_PHOTO_BYTES)) return { code: 'photo_too_large', message: `Zdjęcie ${n} jest większe niż 5 MB.` }
    return decoded ?? { code: 'bad_request', message: `Zdjęcie ${n}: nieprawidłowy base64.` }
  }))
  const loaded: LoadedPhoto[] = []
  let total = 0
  for (const [i, bytes] of all.entries()) {
    const n = i + 1
    const p = photos[i]
    if (isApiError(bytes)) return { ok: false, error: bytes }
    const mime = sniffMime(bytes)
    if (!mime) return fail('photo_not_image', `Zdjęcie ${n} nie jest obrazem JPEG ani PNG.`)
    total += bytes.length
    if (total > MAX_TOTAL_BYTES) return fail('photo_too_large', 'Zdjęcia razem są większe niż 15 MB.')
    loaded.push({ bytes, mime, x: p.x, y: p.y, zoom: p.zoom })
  }
  return { ok: true, photos: loaded }
}
