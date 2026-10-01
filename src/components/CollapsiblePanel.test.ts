import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CollapsiblePanel } from './CollapsiblePanel'

// Dzieci jako argumenty: typy Reacta wymagają `children` w propsach, a linter
// zabrania przekazywać je tamtędy.
const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement

const render = (open: boolean, summary?: string) =>
  renderToStaticMarkup(
    h(CollapsiblePanel, { id: 'form', title: '2. Uzupełnij dane', summary, open, onToggle: () => {}, className: 'karta' }, createElement('input', { name: 'tytul' })),
  )

describe('CollapsiblePanel', () => {
  it('rozwinięty: aria-expanded=true, treść widoczna', () => {
    const html = render(true)
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-controls="panel-form"')
    expect(html).toContain('id="panel-form"')
    expect(html).not.toMatch(/id="panel-form"[^>]*hidden/)
    expect(html).toContain('class="karta"')
  })
  it('zwinięty: aria-expanded=false, treść ukryta, ale NADAL w drzewie', () => {
    const html = render(false)
    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/id="panel-form"[^>]*hidden/)
    expect(html).toContain('name="tytul"')
  })
  it('podsumowanie widać tylko po zwinięciu', () => {
    expect(render(false, 'Wykład')).toContain('Wykład')
    expect(render(true, 'Wykład')).not.toContain('Wykład')
  })
})
