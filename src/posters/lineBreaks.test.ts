import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { posterRegistry } from './registry'

// Enter w polu tytułu/podtytułu łamie wiersz na plakacie: tekst z "\n"
// trafia do elementu z `white-space: pre-line` (Wykład: `pre` - linia
// informacji jest celowo bez zawijania).
describe('ręczne łamanie wierszy', () => {
  for (const [key, entry] of Object.entries(posterRegistry)) {
    it(`${key}: tytuł z Enterem renderuje się z zachowanym łamaniem`, () => {
      const html = renderToStaticMarkup(createElement(entry.Component, { data: { title: 'Pierwszy\nDrugi' } }))
      expect(html).toMatch(/white-space:pre-line[^>]*>\s*Pierwszy\nDrugi/)
    })
  }

  it('Wykład: podtytuł z Enterem łamie się, ale bez zawijania', () => {
    const html = renderToStaticMarkup(createElement(posterRegistry.wyklad.Component, { data: { subtitle: 'Linia 1\nLinia 2' } }))
    expect(html).toMatch(/white-space:pre"[^>]*>Linia 1\nLinia 2/)
  })

  it('Gala: lokalizacja z Enterem łamie się, ale bez zawijania (#51)', () => {
    const html = renderToStaticMarkup(createElement(posterRegistry.gala.Component, { data: { location: 'Działownia,\nsala 1/15' } }))
    expect(html).toMatch(/white-space:pre"[^>]*>.*Działownia,\nsala 1\/15/s)
  })
})
