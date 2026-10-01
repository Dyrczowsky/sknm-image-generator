import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SegmentedToggle } from './SegmentedToggle'
import { LangToggle } from './LangToggle'

describe('SegmentedToggle', () => {
  it('grupa z etykietą, jeden przycisk na opcję, aktywny ma aria-pressed', () => {
    const html = renderToStaticMarkup(
      createElement(SegmentedToggle<'png' | 'pdf'>, {
        value: 'pdf',
        onChange: () => {},
        ariaLabel: 'Typ pliku',
        options: [{ value: 'png', label: 'PNG' }, { value: 'pdf', label: 'PDF' }],
      }),
    )
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="Typ pliku"')
    expect(html).toMatch(/aria-pressed="false"[^>]*>PNG</)
    expect(html).toMatch(/aria-pressed="true"[^>]*>PDF</)
  })

  it('LangToggle wygląda jak dotychczas (PL/EN, etykieta „Język plakatu")', () => {
    const html = renderToStaticMarkup(createElement(LangToggle, { value: 'pl', onChange: () => {} }))
    expect(html).toContain('aria-label="Język plakatu"')
    expect(html).toMatch(/aria-pressed="true"[^>]*>PL</)
    expect(html).toMatch(/aria-pressed="false"[^>]*>EN</)
    expect(html).toContain('bg-accent text-white')
  })
})
