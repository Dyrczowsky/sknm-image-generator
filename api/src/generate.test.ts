import { describe, expect, it, vi } from 'vitest'
import type { Env } from './env'
import { generate } from './generate'
import type { RenderResult } from '../../src/api/types'

const env = {} as Env
const owner = { id: 'u1', email: 'a@b.pl' }
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 1, 2])
const REF = 'a'.repeat(64) + '.jpg'
const PNG_B64 = btoa('PNGDATA')

const okRender = (): RenderResult => ({
  ok: true,
  png: PNG_B64,
  width: 1080,
  height: 1080,
  photoRefs: [REF],
  historyRow: { template: 'wyklad' } as never,
})

function setup(over: { render?: RenderResult; uploadImage?: () => Promise<string>; uploadAsset?: () => Promise<void> } = {}) {
  const calls: string[] = []
  const sb = {
    uploadAsset: vi.fn(async () => { calls.push('asset'); await over.uploadAsset?.() }),
    uploadImage: vi.fn(async (path: string, _png?: Uint8Array) => { calls.push('image'); return over.uploadImage ? over.uploadImage() : `https://pub/${path}` }),
    insertHistory: vi.fn(async () => { calls.push('history'); return 42 }),
    registerAsset: vi.fn(async () => undefined),
    apiKeyOwner: vi.fn(async () => null),
    listAssets: vi.fn(async () => []),
    downloadAsset: vi.fn(async () => null),
    signIn: vi.fn(async () => null),
    isMember: vi.fn(async () => true),
  }
  const renderInBrowser = vi.fn(async () => over.render ?? okRender())
  const loadPhotos = vi.fn(async () => ({ ok: true as const, photos: [{ bytes: JPEG, mime: 'image/jpeg' as const, x: 1, y: 2, zoom: 3 }] }))
  return { calls, sb, renderInBrowser, loadPhotos, deps: { renderInBrowser, loadPhotos, supabase: () => sb } }
}
const args = { template: 'gosc', photos: { photo: [{ url: 'https://x/a.jpg', x: 1, y: 2, zoom: 3 }] } }

describe('generate', () => {
  it('szczęśliwa ścieżka: zdjęcia, PNG, historia na końcu', async () => {
    const s = setup()
    const r = await generate(env, owner, args, s.deps)
    expect(r).toEqual({ ok: true, value: expect.objectContaining({ width: 1080, height: 1080, historyId: 42, png: PNG_B64 }) })
    if (r.ok) expect(r.value.url).toMatch(/^https:\/\/pub\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.png$/)
    expect(s.calls).toEqual(['asset', 'image', 'history'])
    expect(s.sb.uploadAsset).toHaveBeenCalledWith(REF, JPEG, 'image/jpeg')
    const png = s.sb.uploadImage.mock.calls[0][1] as Uint8Array
    expect(new TextDecoder().decode(png)).toBe('PNGDATA')
    const row = (s.sb.insertHistory.mock.calls[0] as unknown[])[0] as Record<string, unknown>
    expect(row).toMatchObject({ template: 'wyklad', source: 'ai', created_by: 'u1', image_url: r.ok ? r.value.url : '' })
    // do strony renderu idą data URL-e
    const sent = (s.renderInBrowser.mock.calls[0] as unknown[])[1] as { photos: { photo: { src: string; x: number }[] } }
    expect(sent.photos.photo[0].src).toMatch(/^data:image\/jpeg;base64,/)
    expect(sent.photos.photo[0].x).toBe(1)
  })

  it('photos: nie-obiekt lub dodatkowy klucz to invalid_field bez pobierania zdjęć', async () => {
    for (const photos of ['x', null, [], { photo: [], foo: 1 }]) {
      const s = setup()
      expect(await generate(env, owner, { template: 'gosc', photos }, s.deps)).toMatchObject({ ok: false, error: { code: 'invalid_field' } })
      expect(s.loadPhotos).not.toHaveBeenCalled()
      expect(s.renderInBrowser).not.toHaveBeenCalled()
    }
  })

  it('zdjęcia dla szablonu bez zdjęć to invalid_field, puste photo przechodzi', async () => {
    const s = setup()
    expect(await generate(env, owner, { template: 'wyklad', photos: { photo: [{ url: 'https://x/a.jpg' }] } }, s.deps))
      .toMatchObject({ ok: false, error: { code: 'invalid_field' } })
    expect(s.loadPhotos).not.toHaveBeenCalled()
    await generate(env, owner, { template: 'wyklad', photos: { photo: [] } }, s.deps)
    expect(s.loadPhotos).toHaveBeenCalled()
  })

  it('nieznany szablon i obce pole odrzucone przed pobraniem zdjęć i renderem', async () => {
    const s = setup()
    expect(await generate(env, owner, { template: 'nie-ma', photos: { photo: [{ url: 'https://x/a.jpg' }] } }, s.deps))
      .toMatchObject({ ok: false, error: { code: 'unknown_template' } })
    expect(await generate(env, owner, { template: 'wyklad', fields: { nie_ma: 'x' } }, s.deps))
      .toMatchObject({ ok: false, error: { code: 'invalid_field' } })
    expect(s.loadPhotos).not.toHaveBeenCalled()
    expect(s.renderInBrowser).not.toHaveBeenCalled()
  })

  it('save: false renderuje, ale nic nie zapisuje i nie przekazuje "save" stronie renderu', async () => {
    const s = setup({ render: { ...okRender(), preview: 'JPG' } as RenderResult })
    const r = await generate(env, owner, { ...args, save: false }, s.deps)
    expect(r).toEqual({ ok: true, value: { url: null, historyId: null, width: 1080, height: 1080, png: PNG_B64, preview: 'JPG' } })
    expect(s.calls).toEqual([])
    expect((s.renderInBrowser.mock.calls[0] as unknown[])[1]).not.toHaveProperty('save')
    expect(await generate(env, owner, { ...args, save: 'nie' }, s.deps)).toMatchObject({ ok: false, error: { code: 'invalid_field' } })
  })

  it('brak szablonu daje bad_request bez renderu', async () => {
    const s = setup()
    const r = await generate(env, owner, { foo: 1 }, s.deps)
    expect(r).toMatchObject({ ok: false, error: { code: 'bad_request' } })
    expect(s.renderInBrowser).not.toHaveBeenCalled()
  })

  it('błąd zdjęć z loadPhotos jest przekazany', async () => {
    const s = setup()
    s.deps.loadPhotos = vi.fn(async () => ({ ok: false as const, error: { code: 'photo_not_image' as const, message: 'x' } })) as never
    expect(await generate(env, owner, args, s.deps)).toEqual({ ok: false, error: { code: 'photo_not_image', message: 'x' } })
    expect(s.renderInBrowser).not.toHaveBeenCalled()
  })

  it('błąd renderu i render_unavailable przechodzą bez zmian', async () => {
    for (const code of ['invalid_field', 'render_unavailable'] as const) {
      const error = { code, message: 'm' }
      const s = setup({ render: { ok: false, error } })
      expect(await generate(env, owner, args, s.deps)).toEqual({ ok: false, error })
      expect(s.calls).toEqual([])
    }
  })

  it('różna liczba photoRefs i zdjęć daje render_failed', async () => {
    const s = setup({ render: { ...(okRender() as Extract<RenderResult, { ok: true }>), photoRefs: [] } })
    expect(await generate(env, owner, args, s.deps)).toMatchObject({ ok: false, error: { code: 'render_failed' } })
    expect(s.calls).toEqual([])
  })

  it('błąd uploadImage: storage_failed, bez historii i bez wycieku treści', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const s = setup({ uploadImage: async () => { throw new Error('Supabase: SEKRETNA treść') } })
    const r = await generate(env, owner, args, s.deps)
    expect(r).toMatchObject({ ok: false, error: { code: 'storage_failed' } })
    expect(JSON.stringify(r)).not.toContain('SEKRETNA')
    expect(s.sb.insertHistory).not.toHaveBeenCalled()
  })

  it('błąd uploadAsset: storage_failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const s = setup({ uploadAsset: async () => { throw new Error('boom') } })
    expect(await generate(env, owner, args, s.deps)).toMatchObject({ ok: false, error: { code: 'storage_failed' } })
    expect(s.sb.uploadImage).not.toHaveBeenCalled()
  })

  it('istniejące zdjęcie (uploadAsset kończy się sukcesem) nie psuje wyniku', async () => {
    const s = setup({ uploadAsset: async () => undefined })
    expect((await generate(env, owner, args, s.deps)).ok).toBe(true)
  })
})
