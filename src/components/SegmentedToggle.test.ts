import { describe, expect, it } from 'vitest'
import { SegmentedToggle } from './SegmentedToggle'
import { LangToggle } from './LangToggle'
import { buttonClass } from './styles'
import { h, openingTag, render } from './ui/testUtils'

const OPTIONS = [{ value: 'png', label: 'PNG' }, { value: 'pdf', label: 'PDF' }]
const toggle = (over: object = {}) => render(h(SegmentedToggle, { value: 'pdf', onChange: () => {}, ariaLabel: 'Typ pliku', options: OPTIONS, ...over }))

describe('SegmentedToggle', () => {
  it('grupa z etykietą, jeden przycisk na opcję, aktywny ma aria-pressed', () => {
    const html = toggle()
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="Typ pliku"')
    expect(html).toMatch(/aria-pressed="false"[^>]*>PNG</)
    expect(html).toMatch(/aria-pressed="true"[^>]*>PDF</)
    expect(html.match(/<button/g)).toHaveLength(2)
  })

  it('ma wysokość kontrolek z prymitywów (sm i md)', () => {
    const height = (size: 'sm' | 'md') => buttonClass({ size }).split(' ').filter((c) => /^(min-\[900px\]:)?h-\d+$/.test(c))
    expect(height('sm')).toHaveLength(2)
    for (const size of ['sm', 'md'] as const) {
      const group = openingTag(toggle({ size }), '<div')
      for (const cls of height(size)) expect(group, `${size}: ${cls}`).toContain(cls)
    }
    expect(openingTag(toggle(), '<div')).toContain(height('sm')[0])
  })

  it('opcja wybrana i niewybrana mają tę samą wagę pisma - zmiana niczego nie przesuwa', () => {
    const html = toggle()
    const weights = [...html.matchAll(/<button[^>]*class="([^"]*)"/g)].map((m) => m[1].split(' ').filter((c) => c.startsWith('font-')))
    expect(weights).toHaveLength(2)
    expect(weights[0]).toEqual(weights[1])
  })

  it('fill: opcje dzielą całą szerokość', () => {
    const html = toggle({ fill: true })
    expect(openingTag(html, '<div')).toContain('w-full')
    expect(html.match(/<button[^>]*flex-1/g)).toHaveLength(2)
    expect(toggle()).not.toContain('flex-1')
  })
})

describe('LangToggle', () => {
  const html = render(h(LangToggle, { value: 'pl', onChange: () => {} }))

  it('przełącznik PL / EN nazwany „Język plakatu"', () => {
    expect(html).toContain('aria-label="Język plakatu"')
    expect(html).toMatch(/aria-pressed="true"[^>]*>PL</)
    expect(html).toMatch(/aria-pressed="false"[^>]*>EN</)
  })

  it('ma widoczny podpis „Język plakatu" (to nie język interfejsu), ukryty przed czytnikami - grupa ma już tę nazwę', () => {
    expect(html).toMatch(/<span[^>]*aria-hidden="true"[^>]*>Język plakatu<\/span>/)
    expect(html).not.toMatch(/<span[^>]*sr-only[^>]*>Język plakatu/)
  })
})
