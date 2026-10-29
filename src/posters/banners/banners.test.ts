import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { posterRegistry } from '../registry'
import { BANNER_PAD, BANNER_SAFE_W, SHAPE_SIZE } from '../shape'
import { PosterScaled } from '../../components/PosterScaled'
import { CLUB_NAME } from '../copy'
import { schemesFor } from '../schemes'
import { DEFAULT_TEMPLATES } from '../../db/schema'
import type { RawPosterData } from '../../types'

const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement

describe('banery', () => {
  it('bezpieczna kolumna mieści się w obu kształtach', () => {
    expect(SHAPE_SIZE.event.width - 2 * BANNER_PAD).toBe(BANNER_SAFE_W)
    // Telefon pokazuje środkowe (640/360)/(820/312) okładki strony.
    const mobileVisible = SHAPE_SIZE.cover.width * ((640 / 360) / (820 / 312))
    expect(BANNER_SAFE_W).toBeLessThanOrEqual(mobileVisible)
  })

  for (const [key, entry] of Object.entries(posterRegistry)) {
    for (const shape of ['cover', 'event'] as const) {
      it(`${key}: baner renderuje się w kształcie ${shape} na pustych danych`, () => {
        const { width, height } = SHAPE_SIZE[shape]
        const html = renderToStaticMarkup(h(PosterScaled, { size: width / 2, shape }, h(entry.Banner, { data: {} })))
        // wrapper skalowania + ramka banera; węzeł eksportu ma min-height
        expect(html.split(`width:${width}px;height:${height}px`).length - 1).toBe(2)
        expect(html).toContain(`width:${width}px;min-height:${height}px`)
        expect(html).toContain('SKNM')
      })
    }
  }

  it('baner niesie nazwę koła (PL/EN), a nie dane wydarzenia', () => {
    const data = { title: 'TYTUL_PLAKATU', speaker: 'PRELEGENT_X', location: 'SALA_Y', event_date: '2031-03-04' }
    for (const entry of Object.values(posterRegistry)) {
      const pl = renderToStaticMarkup(h(PosterScaled, { size: 820, shape: 'cover' }, h(entry.Banner, { data, lang: 'pl' })))
      expect(pl).toContain(CLUB_NAME.pl)
      for (const leaked of ['TYTUL_PLAKATU', 'PRELEGENT_X', 'SALA_Y']) expect(pl).not.toContain(leaked)
      const en = renderToStaticMarkup(h(PosterScaled, { size: 820, shape: 'cover' }, h(entry.Banner, { data, lang: 'en' })))
      expect(en).toContain(CLUB_NAME.en)
    }
  })

  it('layout tylko-banerowy: fallback istnieje, jest zwykłym layoutem i ma te same schematy', () => {
    for (const [key, entry] of Object.entries(posterRegistry)) {
      if (!entry.bannerOnly) continue
      const fallback = posterRegistry[entry.bannerOnly.fallbackKey]
      expect(fallback, `${key}: brak fallbacku`).toBeDefined()
      expect(fallback.bannerOnly).toBeUndefined()
      expect(schemesFor(key)).toEqual(schemesFor(entry.bannerOnly.fallbackKey))
    }
  })

  it('każdy layout z rejestru ma szablon w DEFAULT_TEMPLATES', () => {
    const keys = DEFAULT_TEMPLATES.map((t) => t.poster_key)
    for (const key of Object.keys(posterRegistry)) expect(keys).toContain(key)
  })
})

// Wszystkie pola tekstowe wypełnione (z <&) - baner ma je ignorować.
const FULL: RawPosterData = {
  title: 'Tytuł <b> & co',
  subtitle: 'Podtytuł <i> & co',
  speaker: 'Prelegent & <x>',
  location: 'Sala <1> & 2',
  badge: 'Plakietka & <p>',
  badge2: 'Druga & <p>',
  body: 'Treść & <t>\nDruga linia',
  event_date: '2026-11-12',
  event_time: '18:30',
  lists: { agenda: [{ time: '09:00', title: 'Punkt <a> & b', subtitle: 'Opis & <c>' }] },
}

describe('banery: HTML sprzed formatowania', () => {
  // Data/godzina przykładowa to „dziś" - zegar stoi w miejscu.
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 29, 12, 0))
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  for (const [key, entry] of Object.entries(posterRegistry)) {
    const render = (data: RawPosterData) => renderToStaticMarkup(h(entry.Banner, { data }))

    it(`${key}: puste dane`, () => {
      expect(render({})).toMatchSnapshot()
    })

    it(`${key}: tytuł z <&`, () => {
      expect(render({ title: 'A <b> & C' })).toMatchSnapshot()
    })

    it(`${key}: wszystkie pola`, () => {
      expect(render(FULL)).toMatchSnapshot()
    })
  }
})
