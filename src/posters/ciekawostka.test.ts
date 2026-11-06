import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { posterRegistry } from './registry'
import { PosterScaled } from '../components/PosterScaled'
import { DEFAULT_TEMPLATES } from '../db/schema'
import type { PosterLang, PosterShape, RawPosterData } from '../types'

const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement

// Plakat Ciekawostki w danym kształcie (kontekst kształtu przez PosterScaled).
const render = (data: RawPosterData, shape: PosterShape, lang: PosterLang = 'pl') =>
  renderToStaticMarkup(h(PosterScaled, { size: 540, shape }, h(posterRegistry.ciekawostka.Component, { data, lang })))

describe('Ciekawostka', () => {
  it('pusty formularz: przykładowe teksty i etykieta PL', () => {
    const html = render({}, 'square')
    expect(html).toContain('CZY WIESZ, ŻE…')
    expect(html).toContain('SKNM powstało z inicjatywy studentów?')
    expect(html).toContain('sknm.pk.edu.pl')
    expect(html).toContain('studencka inicjatywa utworzenia koła naukowego matematyków')
  })

  it('EN: etykieta DID YOU KNOW…', () => {
    expect(render({}, 'square', 'en')).toContain('DID YOU KNOW…')
  })

  it('kwadrat: ramka 1080×1080, zdjęcie 1080 × 540', () => {
    const html = render({}, 'square')
    expect(html).toContain('width:1080px;height:1080px')
    expect(html).toContain('1080 × 540')
  })

  it('story: ramka 1080×1920', () => {
    expect(render({}, 'story')).toContain('width:1080px;height:1920px')
  })

  it('ukryty opis znika', () => {
    const shown = render({ body: 'OPIS_X' }, 'square')
    expect(shown).toContain('OPIS_X')
    expect(shown).not.toMatch(/display:none[^>]*>OPIS_X/)
    const html = render({ body: 'OPIS_X', visibility: { body: false } }, 'square')
    expect(html).toMatch(/display:none[^>]*>OPIS_X/)
  })

  it('układy B i C na razie rysują się bez błędu', () => {
    for (const ciekawostkaLayout of ['panorama', 'archiwum'] as const) {
      expect(render({ ciekawostkaLayout }, 'square')).toContain('SKNM powstało z inicjatywy studentów?')
    }
  })

  it('rejestr: storyShape i szablon domyślny', () => {
    expect(posterRegistry.ciekawostka.storyShape).toBe(true)
    expect(posterRegistry.ciekawostka.bannerPhoto).toBe(true)
    expect(DEFAULT_TEMPLATES.some((t) => t.poster_key === 'ciekawostka')).toBe(true)
  })
})
