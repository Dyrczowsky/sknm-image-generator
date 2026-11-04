import { createElement } from 'react'
import type { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { posterRegistry } from './registry'
import type { PosterProps, QrPlacement, QrSide } from '../types'

const URL = 'https://sknm.pk.edu.pl'

const render = (Component: ComponentType<PosterProps>, qrSide?: QrSide, qrPlacement?: QrPlacement, qrUrl = URL) =>
  renderToStaticMarkup(createElement(Component, { data: { qrUrl, qrSide, qrPlacement, event_date: '2026-11-27' } }))

// Kod QR to jedyny <svg> z `role="img"` na plakacie.
const qrCount = (markup: string) => markup.split('role="img"').length - 1
const qrAt = (markup: string) => markup.indexOf('role="img"')
// Pierwsza grafika w slocie logotypów (logo PK).
const logoAt = (markup: string) => markup.indexOf('alt="Logo"')

const posters = Object.entries(posterRegistry).filter(([, e]) => !e.bannerOnly)
// Layouty za ciasne na wiersz nad stopką - kod zawsze w rzędzie stopki.
const INLINE_ONLY = ['konferencja', 'rekrutacja']
const roomy = posters.filter(([k]) => !INLINE_ONLY.includes(k))
const banners = Object.entries(posterRegistry)

describe('kod QR w stopce plakatów', () => {
  it.each(posters)('%s: dokładnie jeden kod, bez linku - żaden', (_, { Component }) => {
    for (const side of ['left', 'right'] as const) {
      for (const placement of ['above', 'inline'] as const) {
        expect(qrCount(render(Component, side, placement))).toBe(1)
        expect(qrCount(render(Component, side, placement, ''))).toBe(0)
      }
    }
  })

  it.each(roomy)('%s: „nad stopką" - własny wiersz przy lewym/prawym marginesie', (_, { Component }) => {
    expect(render(Component, 'left', 'above')).toContain('data-qr-row="left" style="display:flex;justify-content:flex-start;margin:0 0 0 -12px"')
    expect(render(Component, 'right', 'above')).toContain('data-qr-row="right" style="display:flex;justify-content:flex-end;margin:0 -12px 0 0"')
  })

  it.each(posters)('%s: „w stopce, po lewej" - na lewym marginesie, przed treścią stopki', (key, { Component }) => {
    const markup = render(Component, 'left', INLINE_ONLY.includes(key) ? 'above' : 'inline')
    expect(markup).not.toContain('data-qr-row')
    // Kod otwiera grupę lewego rogu, więc nic nie stoi między nim a krawędzią.
    expect(markup).toMatch(/data-footer-lead="true" style="[^"]*"><div data-qr-inline="left"/)
  })

  it.each(posters)('%s: „w stopce, przy logotypach" - tuż przed logo', (key, { Component }) => {
    const markup = render(Component, 'right', INLINE_ONLY.includes(key) ? 'above' : 'inline')
    expect(markup).not.toContain('data-qr-row')
    expect(markup).not.toContain('data-qr-inline')
    expect(qrAt(markup)).toBeLessThan(logoAt(markup))
    expect(qrAt(markup)).toBeGreaterThan(markup.lastIndexOf('data-footer-lead'))
  })

  it.each(roomy)('%s: stare zapisy bez pól - po lewej, nad stopką', (_, { Component }) => {
    expect(render(Component)).toContain('data-qr-row="left"')
  })
})

describe('kod QR w stopce banerów', () => {
  it.each(banners)('%s: zawsze w rzędzie stopki (baner jest za niski na osobny wiersz)', (_, { Banner }) => {
    expect(render(Banner, 'left', 'above')).not.toContain('data-qr-row')
    expect(qrCount(render(Banner, 'left', 'above'))).toBe(1)
  })

  it.each(banners)('%s: po lewej - na lewym marginesie, przy logotypach - tuż przed logo', (_, { Banner }) => {
    const left = render(Banner, 'left')
    expect(left).toContain('data-qr-inline="left"')
    const right = render(Banner, 'right')
    expect(right).not.toContain('data-qr-inline')
    expect(qrAt(right)).toBeLessThan(logoAt(right))
    expect(qrCount(right)).toBe(1)
  })
})
