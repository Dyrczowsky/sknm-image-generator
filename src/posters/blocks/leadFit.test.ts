import { describe, expect, it } from 'vitest'
import { LEAD_MIN_WIDTH_SCALE, leadFit } from './leadFit'

const BAND = 72

describe('leadFit: treść lewego rogu w pasie stopki', () => {
  it('tekst wyższy niż pas maleje do wysokości pasa', () => {
    const { scale, style } = leadFit({ width: 400, height: 140 }, { top: 20, height: 100 }, BAND)
    expect(scale).toBeCloseTo(0.72)
    expect(style.transform).toBe('scale(0.72)')
    expect(style.transformOrigin).toBe('left top')
  })

  it('niski tekst nie rośnie', () => {
    const { scale, style } = leadFit({ width: 200, height: 30 }, { top: 8, height: 14 }, BAND)
    expect(scale).toBe(1)
    expect(style.transform).toBeUndefined()
  })

  it('w rzędzie zostaje sam tekst (wierzchołek liter - linia bazowa) w skali', () => {
    const box = { width: 400, height: 140 }
    const ink = { top: 20, height: 100 }
    const { scale, style } = leadFit(box, ink, BAND)
    const footprint = box.height + Number(style.marginTop) + Number(style.marginBottom)
    expect(footprint).toBeCloseTo(BAND)
    expect(Number(style.marginTop)).toBeCloseTo(-ink.top * scale)
    expect(box.width + Number(style.marginRight)).toBeCloseTo(box.width * scale)
  })

  it('treść bez tekstu: całe pudełko', () => {
    const box = { width: 180, height: 44 }
    const { scale, style } = leadFit(box, null, BAND)
    expect(scale).toBe(1)
    expect(box.height + Number(style.marginTop) + Number(style.marginBottom)).toBeCloseTo(44)
  })

  it('za szeroka treść zwęża się, żeby logo nie musiało maleć', () => {
    expect(leadFit({ width: 500, height: 60 }, { top: 0, height: 60 }, BAND, 450).scale).toBeCloseTo(0.9)
  })

  it('ale najwyżej do LEAD_MIN_WIDTH_SCALE skali na wysokość - dalej maleją logotypy', () => {
    const byHeight = BAND / 100
    expect(leadFit({ width: 500, height: 100 }, { top: 0, height: 100 }, BAND, 50).scale).toBeCloseTo(byHeight * LEAD_MIN_WIDTH_SCALE)
  })
})
