import { describe, expect, it } from 'vitest'
import { SLIDE_GROUPS } from '../../slides/defineSlide'
import { SLIDE_LAYOUTS } from '../../slides/komponenty'
import { TRANSITION_KEYS } from '../../slides/types'
import { h, render } from '../ui/testUtils'
import { LayoutGallery } from './LayoutGallery'
import { TransitionGallery, formatSeconds } from './TransitionGallery'

const noop = () => {}

describe('LayoutGallery', () => {
  const html = render(h(LayoutGallery, { theme: 'granat', aspect: '16:9', onPick: noop }))

  it('ma przycisk dla każdego układu', () => {
    expect(html.match(/<button /g)?.length).toBe(SLIDE_LAYOUTS.length)
    for (const layout of SLIDE_LAYOUTS) expect(html).toContain(layout.label)
  })

  it('ma nagłówek każdej niepustej grupy', () => {
    for (const { group, label } of SLIDE_GROUPS) {
      if (SLIDE_LAYOUTS.some((layout) => layout.group === group)) expect(html).toContain(`>${label}</h3>`)
    }
  })

  it('kwadrat ma cztery kolumny', () => {
    expect(render(h(LayoutGallery, { theme: 'granat', aspect: '1:1', onPick: noop }))).toContain('grid-cols-4')
  })
})

describe('TransitionGallery', () => {
  const props = { value: 'wsuniecie' as const, overridden: false, duration: 600, onChange: noop, onDurationChange: noop, onApplyToAll: noop, onResetToDefault: noop }

  it('ma radio dla każdego przejścia, zaznaczone jest wybrane', () => {
    const html = render(h(TransitionGallery, props))
    expect(html.match(/role="radio"/g)?.length).toBe(TRANSITION_KEYS.length)
    expect(html.match(/aria-checked="true"/g)?.length).toBe(1)
    expect(html).toContain('role="radiogroup"')
  })

  it('„Przywróć domyślne" tylko przy nadpisaniu', () => {
    expect(render(h(TransitionGallery, props))).not.toContain('Przywróć domyślne')
    expect(render(h(TransitionGallery, { ...props, overridden: true }))).toContain('Przywróć domyślne')
  })

  it('pokazuje czas w sekundach', () => {
    expect(render(h(TransitionGallery, props))).toContain('0,6 s')
  })
})

describe('formatSeconds', () => {
  it('formatuje po polsku', () => {
    expect(formatSeconds(600)).toBe('0,6 s')
    expect(formatSeconds(1000)).toBe('1 s')
    expect(formatSeconds(350)).toBe('0,35 s')
  })
})
