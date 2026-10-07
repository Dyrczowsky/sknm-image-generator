import { describe, expect, it } from 'vitest'
import { PAGES } from '../utils/route'
import type { Page } from '../utils/route'
import { TopBar } from './TopBar'
import { h, openingTag, render } from './ui/testUtils'

const bar = (over: object = {}) =>
  render(h(TopBar, { page: 'editor', remote: true, help: h('button', null, 'POMOC'), language: h('span', null, 'JĘZYK'), account: h('span', null, 'KONTO'), ...over }))

describe('TopBar', () => {
  it('jest nagłówkiem strony z nazwą aplikacji', () => {
    const html = bar()
    expect(html.startsWith('<header')).toBe(true)
    expect(html).toContain('SKNM')
  })

  it('nawigacja stron to landmark z nazwą i prawdziwymi odnośnikami z hashem', () => {
    const html = bar()
    expect(openingTag(html, '<nav')).toContain('aria-label="Strony"')
    expect(html.match(/<nav/g)).toHaveLength(1)
    const links = [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1])
    expect(links).toEqual(PAGES.map((p) => p.hash))
    for (const { label } of PAGES) expect(html).toContain(`${label}</a>`)
    expect(html).not.toContain('role="button"')
  })

  it('bieżąca strona - i tylko ona - ma aria-current="page"', () => {
    for (const { page, hash } of PAGES) {
      const html = bar({ page })
      expect(html.match(/aria-current="page"/g), page).toHaveLength(1)
      expect(openingTag(html, `<a href="${hash}"`), page).toContain('aria-current="page"')
    }
  })

  it('bez danych wspólnych (brak Supabase) nie ma nawigacji ani odnośników do stron', () => {
    const html = bar({ remote: false })
    expect(html).not.toContain('<nav')
    expect(html).not.toContain('<a ')
    expect(html).toContain('POMOC')
  })

  it('pomoc, język plakatu i konto stoją w tej kolejności, za nawigacją', () => {
    const html = bar()
    const order = ['</nav>', 'POMOC', 'JĘZYK', 'KONTO'].map((part) => html.indexOf(part))
    expect(order.every((at) => at >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('liczba otwartych notatek stoi przy „Notatki" z dopowiedzeniem dla czytników', () => {
    const html = bar({ openNotes: 3 })
    const notes = html.slice(html.indexOf('href="#/notatki"'))
    expect(notes).toMatch(/Notatki<span[^>]*>3<span class="sr-only"> do zrobienia<\/span><\/span><\/a>/)
    expect(bar({ openNotes: 0 })).not.toContain('do zrobienia')
  })

  it('nieznana wartość strony nie wysadza paska', () => {
    expect(bar({ page: 'nie-ma' as Page })).not.toContain('aria-current')
  })
})
