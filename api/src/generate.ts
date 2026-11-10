import type { ApiError, RenderInput, RenderPhoto } from '../../src/api/types'
import type { Env } from './env'
import { loadPhotos, toDataUrl, type PhotoIn } from './photos'
import { renderInBrowser } from './render'
import { supabase } from './supabase'

export interface GenerateArgs extends Omit<RenderInput, 'photos'> {
  photos?: { photo?: PhotoIn[] }
}

export interface GenerateOk { url: string; width: number; height: number; historyId: number; png: string }

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
  const input = args as GenerateArgs
  const photoList = input.photos?.photo
  if (photoList !== undefined && !Array.isArray(photoList)) return fail('bad_request', 'Pole "photos.photo" musi być tablicą.')

  const loadedResult = await deps.loadPhotos(photoList ?? [])
  if (!loadedResult.ok) return { ok: false, error: loadedResult.error }
  const loaded = loadedResult.photos

  const renderPhotos: RenderPhoto[] = loaded.map((p) => ({ src: toDataUrl(p.bytes, p.mime), x: p.x, y: p.y, zoom: p.zoom }))
  const renderInput: RenderInput = { ...input, photos: photoList === undefined ? undefined : { photo: renderPhotos } }

  const rendered = await deps.renderInBrowser(env, renderInput)
  if (!rendered.ok) return { ok: false, error: rendered.error }
  if (rendered.photoRefs.length !== loaded.length) return fail('render_failed', 'Renderowanie zwróciło niezgodną liczbę zdjęć.')

  try {
    const png = fromBase64(rendered.png)
    const sb = deps.supabase(env)
    for (const [i, ref] of rendered.photoRefs.entries()) await sb.uploadAsset(ref, loaded[i].bytes, loaded[i].mime)
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.png`
    const url = await sb.uploadImage(path, png)
    // Historia na końcu, żeby nigdy nie wskazywała brakującego PNG.
    const historyId = await sb.insertHistory({ ...rendered.historyRow, source: 'ai', image_url: url })
    return { ok: true, value: { url, width: rendered.width, height: rendered.height, historyId, png: rendered.png } }
  } catch (e) {
    console.error('generate: zapis nie powiódł się:', e instanceof Error ? e.message : 'nieznany błąd')
    return fail('storage_failed', 'Nie udało się zapisać obrazu. Spróbuj ponownie za chwilę.')
  }
}
