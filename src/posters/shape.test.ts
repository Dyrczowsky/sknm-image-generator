import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SHAPE_SIZE } from './shape'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterScaled } from '../components/PosterScaled'

// Dzieci jako argumenty: typy Reacta wymagają `children` w propsach, a linter
// zabrania przekazywać je tamtędy.
const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement

const frame = () => h(PosterFrame, null, 'x')

describe('kształty plakatu', () => {
  it('SHAPE_SIZE: kwadrat, pion, poziom na skali 1080', () => {
    expect(SHAPE_SIZE.square).toEqual({ width: 1080, height: 1080 })
    expect(SHAPE_SIZE.portrait).toEqual({ width: 1080, height: 1528 })
    expect(SHAPE_SIZE.landscape).toEqual({ width: 1528, height: 1080 })
  })

  it('PosterFrame bez kontekstu = kwadrat 1080×1080 (miniatury bez zmian)', () => {
    expect(renderToStaticMarkup(frame())).toContain('width:1080px;height:1080px')
  })

  it('PosterScaled bez `shape` = kwadrat, `size` to szerokość i wysokość', () => {
    const html = renderToStaticMarkup(h(PosterScaled, { size: 540 }, frame()))
    expect(html).toContain('width:540px;height:540px')
    expect(html).toContain('width:1080px;height:1080px')
  })

  it('PosterScaled shape=portrait: ramka 1080×1528, pudełko 540×764', () => {
    const html = renderToStaticMarkup(h(PosterScaled, { size: 540, shape: 'portrait' }, frame()))
    expect(html).toContain('width:540px;height:764px')
    // dwa wrappery PosterScaled + sama ramka (kształt dotarł przez kontekst)
    expect(html.split('width:1080px;height:1528px').length - 1).toBe(3)
  })

  it('PosterScaled shape=landscape: ramka 1528×1080, pudełko 764×540', () => {
    const html = renderToStaticMarkup(h(PosterScaled, { size: 764, shape: 'landscape' }, frame()))
    expect(html).toContain('width:764px;height:540px')
    expect(html.split('width:1528px;height:1080px').length - 1).toBe(3)
  })
})
