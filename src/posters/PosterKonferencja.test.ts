import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PosterKonferencja } from './PosterKonferencja'

const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement

describe('PosterKonferencja', () => {
  it('domyślnie zachowuje sztywny kwadrat', () => {
    const html = renderToStaticMarkup(h(PosterKonferencja, { data: {} }))
    expect(html).toContain('width:1080px;height:1080px')
    expect(html).not.toContain('height:auto')
  })

  it('agendaEvenFill: może wydłużyć plakat i równomiernie rozkłada program', () => {
    const html = renderToStaticMarkup(h(PosterKonferencja, { data: { agendaEvenFill: true, lists: { agenda: [{ time: '10:00', title: 'Start' }] } } }))
    expect(html).toContain('height:auto')
    expect(html).toContain('min-height:1080px')
    expect(html).toContain('justify-content:space-between')
  })
})
