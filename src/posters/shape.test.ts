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

  it('SHAPE_SIZE: banery mają wspólną wysokość układu', () => {
    expect(SHAPE_SIZE.cover).toEqual({ width: 1640, height: 624 })
    expect(SHAPE_SIZE.event).toEqual({ width: 1192, height: 624 })
  })

  it('PosterScaled shape=cover: ramka 1640×624, pudełko 820×312', () => {
    const html = renderToStaticMarkup(h(PosterScaled, { size: 820, shape: 'cover' }, frame()))
    expect(html).toContain('width:820px;height:312px')
    expect(html.split('width:1640px;height:624px').length - 1).toBe(2)
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
    // wrapper skalowania + sama ramka (kształt dotarł przez kontekst)
    expect(html.split('width:1080px;height:1528px').length - 1).toBe(2)
    expect(html).toContain('width:1080px;min-height:1528px')
  })

  it('PosterScaled shape=landscape: ramka 1528×1080, pudełko 764×540', () => {
    const html = renderToStaticMarkup(h(PosterScaled, { size: 764, shape: 'landscape' }, frame()))
    expect(html).toContain('width:764px;height:540px')
    expect(html.split('width:1528px;height:1080px').length - 1).toBe(2)
  })

  it('PosterFrame grow w kwadracie: min-height zamiast stałej wysokości', () => {
    expect(renderToStaticMarkup(h(PosterFrame, { grow: true }, 'x'))).toContain('width:1080px;min-height:1080px')
  })

  it('PosterFrame grow na papierze i banerze: rozmiar stały', () => {
    for (const shape of ['portrait', 'cover'] as const) {
      const { width, height } = SHAPE_SIZE[shape]
      const html = renderToStaticMarkup(h(PosterScaled, { size: 100, shape }, h(PosterFrame, { grow: true }, 'x')))
      expect(html.split(`width:${width}px;height:${height}px`).length - 1).toBe(2)
    }
  })

  it('PosterScaled layoutHeight: pudełko rośnie z wydłużonym kwadratem', () => {
    const html = renderToStaticMarkup(h(PosterScaled, { size: 540, layoutHeight: 1400 }, frame()))
    expect(html).toContain('width:540px;height:700px')
    expect(html).toContain('width:1080px;height:1400px')
  })

  it('PosterScaled layoutHeight niższy niż kształt: wysokość kształtu', () => {
    expect(renderToStaticMarkup(h(PosterScaled, { size: 540, layoutHeight: 300 }, frame()))).toContain('width:540px;height:540px')
  })
})
