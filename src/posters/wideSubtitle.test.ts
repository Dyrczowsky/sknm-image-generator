import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { posterRegistry } from './registry'

// Opis w Gali i Dacie: domyślnie wąska kolumna, z `wideSubtitle` bez limitu szerokości.
const html = (key: 'gala' | 'data', wideSubtitle?: boolean) =>
  renderToStaticMarkup(createElement(posterRegistry[key].Component, { data: { subtitle: 'Opis wydarzenia', event_date: '2026-11-12', wideSubtitle } }))

describe('wideSubtitle', () => {
  it.each([
    ['gala', 'max-width:26ch'],
    ['data', 'max-width:24ch'],
  ] as const)('%s: domyślnie wąski opis, z opcją bez limitu', (key, limit) => {
    expect(html(key)).toContain(limit)
    expect(html(key, false)).toContain(limit)
    expect(html(key, true)).not.toContain(limit)
  })
})
