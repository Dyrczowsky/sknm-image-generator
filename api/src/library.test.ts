import { describe, expect, it, vi } from 'vitest'
import type { Env } from './env'
import { listPhotos, savePhoto } from './library'

const env = {} as Env
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 1, 2])

function setup(fail = false) {
  const sb = {
    uploadAsset: vi.fn(async () => { if (fail) throw new Error('boom') }),
    registerAsset: vi.fn(async () => undefined),
    listAssets: vi.fn(async () => [{ ref: 'r.jpg', kind: 'photo', name: 'Kampus', created_at: 't' }]),
  }
  const loadPhotos = vi.fn(async () => ({ ok: true as const, photos: [{ bytes: JPEG, mime: 'image/jpeg' as const }] }))
  return { sb, loadPhotos, deps: { loadPhotos, supabase: () => sb } as never }
}

describe('savePhoto', () => {
  it('zapisuje oryginał pod nazwą SHA-256 + .jpg i wpisuje do biblioteki', async () => {
    const s = setup()
    const r = await savePhoto(env, { name: '  Panorama PK ', url: 'https://x/p.jpg' }, s.deps)
    const hex = Buffer.from(await crypto.subtle.digest('SHA-256', JPEG)).toString('hex')
    expect(r).toEqual({ ok: true, value: { ref: `${hex}.jpg`, name: 'Panorama PK' } })
    expect(s.sb.uploadAsset).toHaveBeenCalledWith(`${hex}.jpg`, JPEG, 'image/jpeg')
    expect(s.sb.registerAsset).toHaveBeenCalledWith(`${hex}.jpg`, 'Panorama PK')
  })
  it('bez nazwy, bez zdjęcia albo z obcym polem: błąd bez zapisu', async () => {
    const s = setup()
    expect(await savePhoto(env, { url: 'https://x/p.jpg' }, s.deps)).toMatchObject({ ok: false, error: { code: 'invalid_field' } })
    expect(await savePhoto(env, { name: 'A' }, s.deps)).toMatchObject({ ok: false, error: { code: 'bad_request' } })
    expect(await savePhoto(env, { name: 'A', url: 'https://x', ref: 'r' }, s.deps)).toMatchObject({ ok: false, error: { code: 'invalid_field' } })
    expect(s.sb.uploadAsset).not.toHaveBeenCalled()
  })
  it('błąd Storage to storage_failed', async () => {
    expect(await savePhoto(env, { name: 'A', url: 'https://x/p.jpg' }, setup(true).deps)).toMatchObject({ ok: false, error: { code: 'storage_failed' } })
  })
})

describe('listPhotos', () => {
  it('zwraca ref, nazwę i datę', async () => {
    expect(await listPhotos(env, setup().deps)).toEqual({ ok: true, value: [{ ref: 'r.jpg', name: 'Kampus', created_at: 't' }] })
  })
})
