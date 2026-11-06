import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { posterRegistry } from './registry'
import { PosterScaled } from '../components/PosterScaled'
import { DEFAULT_TEMPLATES } from '../db/schema'
import { PosterEditContext } from './edit'
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

  it.each(['zdjecie', 'panorama', 'archiwum'] as const)('%s: kwadrat i Story renderują się na pustych danych z placeholderem zdjęcia', (layout) => {
    for (const shape of ['square', 'story'] as const) {
      const html = render({ ciekawostkaLayout: layout }, shape)
      expect(html).toContain('CZY WIESZ, ŻE…')
      expect(html.toLowerCase()).toContain(layout === 'panorama' ? 'panorama' : 'zdjęcie')
    }
  })

  // Przykładowy opis sam zawiera „2001”, więc tu opis jest podany wprost.
  it('archiwum: rok widoczny tylko, gdy wpisany (poza edycją)', () => {
    const body = 'Opis.'
    expect(render({ ciekawostkaLayout: 'archiwum', year: '2001', body }, 'square')).toContain('2001')
    expect(render({ ciekawostkaLayout: 'archiwum', body }, 'square')).not.toContain('2001')
    expect(render({ ciekawostkaLayout: 'zdjecie', year: '2001', body }, 'square')).not.toContain('2001')
    expect(render({ ciekawostkaLayout: 'panorama', year: '2001', body }, 'square')).not.toContain('2001')
  })

  it('archiwum: w edycji pusty rok jest polem z podpowiedzią „Rok”', () => {
    const editing = (data: RawPosterData) =>
      renderToStaticMarkup(h(PosterEditContext.Provider, { value: { editable: true, onText: () => {} } },
        h(PosterScaled, { size: 540, shape: 'square' }, h(posterRegistry.ciekawostka.Component, { data }))))
    const html = editing({ ciekawostkaLayout: 'archiwum' })
    expect(html).toContain('aria-label="Rok"')
    expect(editing({ ciekawostkaLayout: 'zdjecie' })).not.toContain('aria-label="Rok"')
  })

  it('układy różnią się markupem', () => {
    const a = render({ ciekawostkaLayout: 'zdjecie' }, 'square')
    expect(render({ ciekawostkaLayout: 'panorama' }, 'square')).not.toBe(a)
    expect(render({ ciekawostkaLayout: 'archiwum' }, 'square')).not.toBe(a)
  })

  // Story: górne 250 px zasłania Instagram - treść i sygnet zaczynają się niżej.
  it.each(['panorama', 'archiwum'] as const)('%s: w Story treść zaczyna się pod strefą 250 px', (layout) => {
    expect(render({ ciekawostkaLayout: layout }, 'story')).toContain('padding:250px 72px 340px')
  })

  it('rejestr: storyShape i szablon domyślny', () => {
    expect(posterRegistry.ciekawostka.storyShape).toBe(true)
    expect(posterRegistry.ciekawostka.bannerPhoto).toBe(true)
    expect(DEFAULT_TEMPLATES.some((t) => t.poster_key === 'ciekawostka')).toBe(true)
  })
})
