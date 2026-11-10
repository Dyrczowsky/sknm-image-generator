import { describe, expect, it } from 'vitest'
import { loadPhotos, toDataUrl } from './photos'

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2])
const b64 = (b: Uint8Array) => Buffer.from(b).toString('base64')
const respond = (body: BodyInit, status = 200) => (async () => new Response(body, { status })) as unknown as typeof fetch

describe('loadPhotos', () => {
  it('HTML zamiast obrazu to photo_not_image z numerem zdjęcia', async () => {
    const r = await loadPhotos([{ url: 'https://a.test/1' }, { url: 'https://a.test/2' }], (async (u: string) =>
      new Response(String(u).endsWith('/1') ? jpeg : '<!doctype html><html></html>')) as unknown as typeof fetch)
    expect(r).toMatchObject({ ok: false, error: { code: 'photo_not_image' } })
    if (!r.ok) expect(r.error.message).toContain('Zdjęcie 2')
  })
  it('6 MB to photo_too_large', async () => {
    const big = new Uint8Array(6 * 1024 * 1024)
    big.set(jpeg)
    const r = await loadPhotos([{ url: 'https://a.test/1' }], respond(big))
    expect(r).toMatchObject({ ok: false, error: { code: 'photo_too_large' } })
  })
  it('6 MB w base64 to photo_too_large', async () => {
    const big = new Uint8Array(6 * 1024 * 1024)
    big.set(jpeg)
    expect(await loadPhotos([{ data: b64(big) }])).toMatchObject({ ok: false, error: { code: 'photo_too_large' } })
  })
  it('7 zdjęć to too_many_photos', async () => {
    const r = await loadPhotos(Array.from({ length: 7 }, () => ({ data: b64(jpeg) })))
    expect(r).toMatchObject({ ok: false, error: { code: 'too_many_photos' } })
  })
  it('adres http: to bad_request', async () => {
    expect(await loadPhotos([{ url: 'http://a.test/1' }], respond(jpeg))).toMatchObject({ ok: false, error: { code: 'bad_request' } })
  })
  it('404 to photo_fetch_failed', async () => {
    expect(await loadPhotos([{ url: 'https://a.test/1' }], respond('nie ma', 404))).toMatchObject({ ok: false, error: { code: 'photo_fetch_failed' } })
  })
  it('błąd sieci to photo_fetch_failed', async () => {
    const boom = (async () => { throw new Error('boom') }) as unknown as typeof fetch
    expect(await loadPhotos([{ url: 'https://a.test/1' }], boom)).toMatchObject({ ok: false, error: { code: 'photo_fetch_failed' } })
  })
  it('JPEG z URL i z base64 (także data URL), z x/y/zoom', async () => {
    const r1 = await loadPhotos([{ url: 'https://a.test/1', x: 1, y: 2, zoom: 3 }], respond(jpeg))
    expect(r1).toMatchObject({ ok: true, photos: [{ mime: 'image/jpeg', x: 1, y: 2, zoom: 3 }] })
    const r2 = await loadPhotos([{ data: b64(jpeg) }, { data: `data:image/jpeg;base64,${b64(png)}` }])
    expect(r2).toMatchObject({ ok: true, photos: [{ mime: 'image/jpeg' }, { mime: 'image/png' }] })
    if (r2.ok) expect([...r2.photos[0].bytes]).toEqual([...jpeg])
  })
  it('nieprawidłowy base64 to bad_request', async () => {
    expect(await loadPhotos([{ data: '***' }])).toMatchObject({ ok: false, error: { code: 'bad_request' } })
  })
})

describe('walidacja elementów', () => {
  it.each([[null], ['x'], [5], [[]]])('element %j to bad_request z numerem zdjęcia', async (item) => {
    const r = await loadPhotos([item] as never)
    expect(r).toMatchObject({ ok: false, error: { code: 'bad_request' } })
    if (!r.ok) expect(r.error.message).toContain('Zdjęcie 1')
  })
  it('url i data nietekstowe to bad_request', async () => {
    expect(await loadPhotos([{ url: 5 }] as never)).toMatchObject({ ok: false, error: { code: 'bad_request' } })
    const r = await loadPhotos([{ data: 'QQ==' }, { data: {} }] as never)
    expect(r).toMatchObject({ ok: false, error: { code: 'bad_request' } })
    if (!r.ok) expect(r.error.message).toContain('Zdjęcie 2')
  })
  it('url razem z data to bad_request', async () => {
    expect(await loadPhotos([{ url: 'https://a.test/1', data: b64(jpeg) }], respond(jpeg))).toMatchObject({ ok: false, error: { code: 'bad_request' } })
  })
})

describe('base64 i przekierowania', () => {
  it('zbyt długi, nieprawidłowy base64 to photo_too_large (sprawdzane przed dekodowaniem)', async () => {
    const r = await loadPhotos([{ data: '*'.repeat(8 * 1024 * 1024) }])
    expect(r).toMatchObject({ ok: false, error: { code: 'photo_too_large' } })
  })
  const redirect = (loc: string) => new Response(null, { status: 302, headers: { location: loc } })
  it('przekierowanie na http: to bad_request', async () => {
    expect(await loadPhotos([{ url: 'https://a.test/1' }], (async () => redirect('http://b.test/x')) as unknown as typeof fetch)).toMatchObject({ ok: false, error: { code: 'bad_request' } })
  })
  it('przekierowanie na adres IP to bad_request', async () => {
    for (const loc of ['https://127.0.0.1/x', 'https://[::1]/x', 'https://localhost/x']) {
      expect(await loadPhotos([{ url: 'https://a.test/1' }], (async () => redirect(loc)) as unknown as typeof fetch)).toMatchObject({ ok: false, error: { code: 'bad_request' } })
    }
  })
  it('adres IP w pierwotnym URL to bad_request', async () => {
    expect(await loadPhotos([{ url: 'https://10.0.0.1/x' }], respond(jpeg))).toMatchObject({ ok: false, error: { code: 'bad_request' } })
  })
  it('więcej niż 3 przekierowania to photo_fetch_failed', async () => {
    expect(await loadPhotos([{ url: 'https://a.test/1' }], (async () => redirect('/loop')) as unknown as typeof fetch)).toMatchObject({ ok: false, error: { code: 'photo_fetch_failed' } })
  })
  it('jedno przekierowanie https działa (także względne)', async () => {
    let calls = 0
    const f = (async () => (calls++ === 0 ? redirect('/real.jpg') : new Response(jpeg))) as unknown as typeof fetch
    expect(await loadPhotos([{ url: 'https://a.test/1' }], f)).toMatchObject({ ok: true, photos: [{ mime: 'image/jpeg' }] })
  })
})

describe('toDataUrl', () => {
  it('używa podanego (wykrytego) typu', () => {
    expect(toDataUrl(png, 'image/png')).toBe(`data:image/png;base64,${b64(png)}`)
  })
})
