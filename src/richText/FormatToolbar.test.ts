import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, openingTag, render } from '../components/ui/testUtils'
import { ToolbarButtons } from './FormatToolbar'
import { MARK } from './format'
import type { ToolbarState } from './fieldRegistry'

const base: ToolbarState = { marks: 0, align: null, alignable: true }
const view = (state: Partial<ToolbarState> = {}) => render(h(ToolbarButtons, { state: { ...base, ...state }, onFormat: () => {} }))

// Znacznik otwierający przycisku o danej etykiecie.
const tagOf = (html: string, label: string): string => {
  const at = html.indexOf(`aria-label="${label}"`)
  if (at === -1) throw new Error(`brak przycisku ${label}`)
  const from = html.lastIndexOf('<button', at)
  return html.slice(from, html.indexOf('>', at) + 1)
}

describe('ToolbarButtons', () => {
  beforeEach(() => vi.stubGlobal('navigator', { platform: 'Win32', userAgent: '' }))
  afterEach(() => vi.unstubAllGlobals())

  it('korzeń ma role="toolbar" i nazwę', () => {
    const root = openingTag(view(), '<div')
    expect(root).toContain('role="toolbar"')
    expect(root).toContain('aria-label="Formatowanie tekstu"')
  })

  it('włączony znacznik ma aria-pressed="true", pozostałe "false"', () => {
    const html = view({ marks: MARK.bold })
    expect(tagOf(html, 'Pogrubienie (Ctrl+B)')).toContain('aria-pressed="true"')
    expect(tagOf(html, 'Kursywa (Ctrl+I)')).toContain('aria-pressed="false"')
  })

  it('wyrównanie niedostępne: trzy przyciski mają aria-disabled i wyjaśnienie', () => {
    const html = view({ alignable: false })
    for (const label of ['Do lewej', 'Do środka', 'Do prawej']) {
      const tag = tagOf(html, label)
      expect(tag).toContain('aria-disabled="true"')
      expect(tag).toContain('title="Wyrównanie niedostępne w tym polu"')
    }
  })

  it('aktualne wyrównanie ma aria-pressed="true"', () => {
    const html = view({ align: 'center' })
    expect(tagOf(html, 'Do środka')).toContain('aria-pressed="true"')
    expect(tagOf(html, 'Do lewej')).toContain('aria-pressed="false"')
  })

  it('kolejność przycisków zgodna ze specyfikacją', () => {
    const html = view()
    const labels = [...html.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]).filter((l) => l !== 'Formatowanie tekstu')
    expect(labels).toEqual([
      'Pogrubienie (Ctrl+B)', 'Kursywa (Ctrl+I)', 'Podkreślenie (Ctrl+U)', 'Przekreślenie', 'Kolor akcentu', 'Wyczyść formatowanie',
      'Do lewej', 'Do środka', 'Do prawej',
    ])
  })

  it('na Macu skróty pokazują ⌘ zamiast Ctrl', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: '' })
    expect(tagOf(view(), 'Pogrubienie (⌘B)')).toContain('aria-pressed')
  })
})
