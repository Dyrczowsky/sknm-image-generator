import type { ApiError, RenderInput, RenderOk, RenderPhoto } from '../../src/api/types'
import type { Env } from './env'
import { loadPhotos, toDataUrl, type PhotoIn } from './photos'
import { renderInBrowser } from './render'
import { supabase } from './supabase'
import catalog from './templates.json'

export interface GenerateArgs extends Omit<RenderInput, 'photos'> {
  photos?: { photo?: PhotoIn[] }
  save?: boolean // false = tylko podgląd, nic nie trafia do Storage ani historii
}

// `url` i `historyId` są `null`, gdy `save: false`.
export interface GenerateOk { url: string | null; width: number; height: number; historyId: number | null; png: string; preview?: string }

export type GenerateResult = { ok: true; value: GenerateOk } | { ok: false; error: ApiError }

export interface GenerateDeps {
  renderInBrowser: typeof renderInBrowser
  loadPhotos: typeof loadPhotos
  supabase: typeof supabase
}

const defaultDeps: GenerateDeps = { renderInBrowser, loadPhotos, supabase }

const fail = (code: ApiError['code'], message: string): GenerateResult => ({ ok: false, error: { code, message } })

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function generate(env: Env, args: unknown, deps: GenerateDeps = defaultDeps): Promise<GenerateResult> {
  if (typeof args !== 'object' || args === null || typeof (args as { template?: unknown }).template !== 'string') {
    return fail('bad_request', 'Pole "template" jest wymagane (tekst).')
  }
  // `save` zna tylko Worker; strona renderu odrzuca nieznane pola.
  const { save, ...input } = args as GenerateArgs
  if (save !== undefined && typeof save !== 'boolean') return fail('invalid_field', 'Pole "save" musi być wartością true albo false.')
  const photos: unknown = input.photos
  if (photos !== undefined && (typeof photos !== 'object' || photos === null || Array.isArray(photos))) {
    return fail('invalid_field', 'Pole "photos" musi być obiektem z kluczem "photo".')
  }
  const extra = photos === undefined ? [] : Object.keys(photos as object).filter((k) => k !== 'photo')
  if (extra.length > 0) return fail('invalid_field', `Pole "photos" ma niedozwolone klucze: ${extra.join(', ')}. Dozwolone jest tylko "photo".`)
  const photoList = input.photos?.photo
  if (photoList !== undefined && !Array.isArray(photoList)) return fail('bad_request', 'Pole "photos.photo" musi być tablicą.')
  // Tanie sprawdzenia przed startem przeglądarki; resztę reguł pilnuje strona renderu.
  const template = catalog.templates.find((t) => t.key === input.template)
  if (!template) {
    return fail('unknown_template', `Nieznany szablon ${JSON.stringify(input.template)}. Dostępne: ${catalog.templates.map((t) => t.key).join(', ')}.`)
  }
  const fields: unknown = input.fields
  if (typeof fields === 'object' && fields !== null && !Array.isArray(fields)) {
    const allowed = template.fields.map((f) => f.name)
    const wrong = Object.keys(fields).find((k) => !allowed.includes(k))
    if (wrong !== undefined) return fail('invalid_field', `Pole „${wrong}" nie występuje w szablonie „${template.key}". Dozwolone: ${allowed.join(', ')}.`)
  }
  if (template.photo === null && photoList !== undefined && photoList.length > 0) {
    return fail('invalid_field', `Szablon "${template.key}" nie obsługuje zdjęć.`)
  }

  const loadedResult = await deps.loadPhotos(photoList ?? [])
  if (!loadedResult.ok) return { ok: false, error: loadedResult.error }
  const loaded = loadedResult.photos

  const renderPhotos: RenderPhoto[] = loaded.map((p) => ({ src: toDataUrl(p.bytes, p.mime), x: p.x, y: p.y, zoom: p.zoom }))
  const renderInput: RenderInput = { ...input, photos: photoList === undefined ? undefined : { photo: renderPhotos } }

  const rendered = await deps.renderInBrowser(env, renderInput)
  if (!rendered.ok) return { ok: false, error: rendered.error }
  // Strona renderu to osobny kod - sprawdzamy kształt wyniku, zamiast ufać typom.
  const r = rendered as Partial<RenderOk>
  if (
    r.ok !== true || typeof r.png !== 'string' || !Array.isArray(r.photoRefs) || !r.photoRefs.every((x) => typeof x === 'string') ||
    typeof r.historyRow !== 'object' || r.historyRow === null
  ) return fail('render_failed', 'Renderowanie zwróciło nieprawidłowy wynik.')
  if (rendered.photoRefs.length !== loaded.length) return fail('render_failed', 'Renderowanie zwróciło niezgodną liczbę zdjęć.')

  let png: Uint8Array
  try {
    png = fromBase64(rendered.png)
  } catch {
    return fail('render_failed', 'Renderowanie zwróciło nieprawidłowy obraz.')
  }
  const preview = typeof rendered.preview === 'string' ? rendered.preview : undefined
  if (save === false) return { ok: true, value: { url: null, width: rendered.width, height: rendered.height, historyId: null, png: rendered.png, preview } }

  try {
    const sb = deps.supabase(env)
    for (const [i, ref] of rendered.photoRefs.entries()) await sb.uploadAsset(ref, loaded[i].bytes, loaded[i].mime)
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.png`
    const url = await sb.uploadImage(path, png)
    // Historia na końcu, żeby nigdy nie wskazywała brakującego PNG.
    const historyId = await sb.insertHistory({ ...rendered.historyRow, source: 'ai', image_url: url })
    return { ok: true, value: { url, width: rendered.width, height: rendered.height, historyId, png: rendered.png, preview } }
  } catch (e) {
    console.error('generate: zapis nie powiódł się:', e instanceof Error ? e.message : 'nieznany błąd')
    return fail('storage_failed', 'Nie udało się zapisać obrazu. Spróbuj ponownie za chwilę.')
  }
}
