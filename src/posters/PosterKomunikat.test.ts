import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PosterKomunikat } from './PosterKomunikat'

const render = (data: Parameters<typeof PosterKomunikat>[0]['data']) =>
  renderToStaticMarkup(createElement(PosterKomunikat, { data, lang: 'pl' }))

describe('PosterKomunikat — sala w stopce', () => {
  it('wpisana sala jest na plakacie, przed adresem strony', () => {
    const html = render({ location: 'sala F-110' })
    expect(html).toContain('sala F-110')
    expect(html.indexOf('sala F-110')).toBeLessThan(html.indexOf('sknm.pk.edu.pl'))
  })

  it('pusta sala → przykładowa wartość (jak inne pola)', () => {
    expect(render({})).toContain('sala 304/12')
  })

  it('odznaczona widoczność → sali nie ma, adres strony zostaje', () => {
    const html = render({ location: 'sala F-110', visibility: { location: false } })
    expect(html).not.toContain('sala F-110')
    expect(html).toContain('sknm.pk.edu.pl')
  })
})
