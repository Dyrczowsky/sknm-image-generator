import { describe, expect, it } from 'vitest'
import { buildRenderState } from './renderInput'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import { schemesFor } from '../posters/schemes'
import { encodeScheme } from '../utils/colorScheme'
import { buildCatalog } from './catalog'

const JPG = 'data:image/jpeg;base64,AAAA'
const err = (input: unknown) => {
  const r = buildRenderState(input)
  if (r.ok) throw new Error('oczekiwano błędu')
  return r.error
}
const ok = (input: unknown) => {
  const r = buildRenderState(input)
  if (!r.ok) throw new Error(r.error.message)
  return r
}

describe('buildRenderState', () => {
  it('odrzuca nie-obiekt i nieznane klucze', () => {
    expect(err('x').code).toBe('bad_request')
    expect(err(null).code).toBe('bad_request')
    expect(err({ template: 'wyklad', foo: 1 }).code).toBe('bad_request')
  })

  it('nieznany szablon wypisuje dostępne klucze', () => {
    for (const t of ['nie-ma', 'warsztatBezZdjecia']) {
      const e = err({ template: t })
      expect(e.code).toBe('unknown_template')
      expect(e.message).toContain('wyklad')
    }
  })

  it('domyślny schemat, błędny schemat i niedozwolony akcent', () => {
    expect(ok({ template: 'wyklad' }).state.colorScheme).toBe(encodeScheme(schemesFor('wyklad')[0]))
    const e = err({ template: 'wyklad', scheme: 'nie-ma' })
    expect(e.code).toBe('invalid_scheme')
    expect(e.message).toContain(schemesFor('wyklad')[0])
    const bad = buildCatalog()
      .templates.flatMap((t) => t.schemes.filter((s) => s.accents.length === 0 || s.accents.length < 5).map((s) => ({ t, s })))[0]
    const disallowed = ['zolty', 'pomaranczowy', 'granatowy', 'zloty', 'srebrny'].find((a) => !bad.s.accents.includes(a as never))!
    expect(err({ template: bad.t.key, scheme: `${bad.s.name}~${disallowed}` }).code).toBe('invalid_scheme')
    expect(err({ template: 'wyklad', scheme: `${schemesFor('wyklad')[0]}~xyz` }).code).toBe('invalid_scheme')
  })

  it('pola spoza katalogu, złe typy, długość i formaty', () => {
    const e = err({ template: 'wyklad', fields: { body: 'x' } })
    expect(e.code).toBe('invalid_field')
    expect(e.message).toContain('title')
    expect(err({ template: 'wyklad', fields: { title: 5 } }).code).toBe('invalid_field')
    expect(err({ template: 'wyklad', fields: { title: 'a'.repeat(2001) } }).code).toBe('invalid_field')
    expect(err({ template: 'wyklad', fields: { event_date: '10.11.2026' } }).code).toBe('invalid_field')
    expect(err({ template: 'wyklad', fields: { event_time: '25:00' } }).code).toBe('invalid_field')
    ok({ template: 'wyklad', fields: { event_date: '2026-11-10', event_time: '18:30' } })
  })

  it('usuwa znaki sterujące U+E000-U+F8FF, zostawia \\n', () => {
    const r = ok({
      template: 'wyklad',
      fields: { title: 'A\uE001B\nC\uF8FF\uE000D' },
      options: { qrUrl: 'http://x\uE002.pl' },
    })
    expect(r.state.form.title).toBe('AB\nCD')
    expect(r.state.form.qrUrl).toBe('http://x.pl')
    const k = ok({ template: 'konferencja', lists: { agenda: [{ title: 'T\uE003\nU', time: '\uF8FF10:00' }] } })
    expect(k.state.form.lists.agenda).toEqual([{ title: 'T\nU', time: '10:00' }])
  })

  it('pominięte pola są ukryte', () => {
    const { form } = ok({ template: 'wyklad', fields: { title: 'X' } }).state
    expect(form.visibility).toEqual({ subtitle: false, speaker: false, event_date: false, event_time: false, location: false })
    expect('title' in form.visibility).toBe(false)
    expect('badge' in form.visibility).toBe(false)
    expect(ok({ template: 'wyklad', fields: { title: 'X', location: '' } }).state.form.visibility.location).toBe(false)
  })

  it('zdjęcia', () => {
    expect(err({ template: 'wyklad', photos: { photo: [{ src: JPG }] } }).code).toBe('invalid_field')
    const seven = Array.from({ length: 7 }, () => ({ src: JPG }))
    expect(err({ template: 'warsztat', photos: { photo: seven } }).code).toBe('too_many_photos')
    expect(ok({ template: 'warsztat', photos: { photo: [{ src: JPG }] } }).state.form.photos.photo).toEqual([{ src: JPG, x: 50, y: 50 }])
    expect(err({ template: 'warsztat', photos: { photo: [{ src: 'http://x' }] } }).code).toBe('invalid_field')
    expect(err({ template: 'warsztat', photos: { photo: [{ src: JPG, x: 101 }] } }).code).toBe('invalid_field')
    expect(err({ template: 'warsztat', photos: { photo: [{ src: JPG, zoom: 0.5 }] } }).code).toBe('invalid_field')
    expect(ok({ template: 'warsztat', photos: { photo: [{ src: JPG, zoom: 2 }] } }).state.form.photos.photo[0].zoom).toBe(2)
  })

  it('agenda tylko dla konferencji, do 20 pozycji, same teksty', () => {
    expect(err({ template: 'wyklad', lists: { agenda: [] } }).code).toBe('invalid_field')
    expect(err({ template: 'konferencja', lists: { agenda: Array.from({ length: 21 }, () => ({})) } }).code).toBe('invalid_field')
    expect(err({ template: 'konferencja', lists: { agenda: [{ time: 5 }] } }).code).toBe('invalid_field')
    expect(ok({ template: 'konferencja', lists: { agenda: [{ time: '10:00', title: 'A' }] } }).state.form.lists.agenda).toEqual([{ time: '10:00', title: 'A' }])
  })

  it('opcje', () => {
    expect(err({ template: 'wyklad', options: { fillAgenda: true } }).code).toBe('invalid_field')
    expect(err({ template: 'wyklad', options: { titleScale: 1.5 } }).code).toBe('invalid_field')
    expect(ok({ template: 'wyklad', options: { titleScale: 1.2, showSknmLogo: true } }).state.form).toMatchObject({ titleScale: 1.2, showSknmLogo: true })
  })

  it('domyślne lang i shape, mapowanie story, exportSettings', () => {
    const d = ok({ template: 'wyklad' })
    expect(d.state.lang).toBe('pl')
    expect(d.formatKey).toBe('square')
    const c = ok({ template: 'ciekawostka', shape: 'story' })
    expect(c.shape).toBe('story')
    const w = ok({ template: 'wyklad', shape: 'story' })
    expect([w.formatKey, w.shape]).toEqual(['story', 'square'])
    expect(w.state.exportSettings).toEqual({ ...DEFAULT_EXPORT_SETTINGS, format: 'story' })
  })

  it('formularz opiera się na EMPTY_FORM', () => {
    const { form } = ok({ template: 'wyklad' }).state
    expect(form.showPkLogo).toBe(true)
    expect(form.graphics).toEqual([])
  })
})
