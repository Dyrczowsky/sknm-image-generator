import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { posterRegistry } from '../registry'
import { BANNER_PAD, BANNER_SAFE_W, SHAPE_SIZE } from '../shape'
import { PosterScaled } from '../../components/PosterScaled'
import { CLUB_NAME } from '../copy'

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
        // dwa wrappery PosterScaled + ramka banera
        expect(html.split(`width:${width}px;height:${height}px`).length - 1).toBe(3)
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
})
