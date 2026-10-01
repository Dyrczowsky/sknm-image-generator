import { describe, expect, it } from 'vitest'
import { EXPORT_FORMATS, isPrintFormat, pageSizePt, pixelSize, shapeFor } from './formats'

const paper = (key: string) => {
  const p = EXPORT_FORMATS[key].paper
  if (!p) throw new Error(`${key}: brak papieru`)
  return p
}

describe('formaty eksportu', () => {
  it('klucze i kolejność: social, potem papier', () => {
    expect(Object.keys(EXPORT_FORMATS)).toEqual(['square', 'story', 'a4', 'a3', 'a2'])
  })

  it('isPrintFormat', () => {
    expect(isPrintFormat('square')).toBe(false)
    expect(isPrintFormat('story')).toBe(false)
    for (const k of ['a4', 'a3', 'a2']) expect(isPrintFormat(k)).toBe(true)
  })

  it('nieznany klucz formatu → jak kwadrat, bez wyjątku', () => {
    expect(isPrintFormat('nieistnieje')).toBe(false)
    expect(shapeFor('nieistnieje', 'landscape')).toBe('square')
  })

  it('shapeFor: social zawsze kwadrat, papier = orientacja', () => {
    expect(shapeFor('square', 'landscape')).toBe('square')
    expect(shapeFor('story', 'portrait')).toBe('square')
    expect(shapeFor('a4', 'portrait')).toBe('portrait')
    expect(shapeFor('a2', 'landscape')).toBe('landscape')
  })

  it('pixelSize przy 300 dpi', () => {
    expect(pixelSize(paper('a4'), 'portrait', 300)).toEqual({ width: 2480, height: 3508 })
    expect(pixelSize(paper('a3'), 'portrait', 300)).toEqual({ width: 3508, height: 4961 })
    expect(pixelSize(paper('a2'), 'portrait', 300)).toEqual({ width: 4961, height: 7016 })
  })

  it('pixelSize: poziom zamienia boki, niższe dpi skaluje', () => {
    expect(pixelSize(paper('a4'), 'landscape', 300)).toEqual({ width: 3508, height: 2480 })
    expect(pixelSize(paper('a4'), 'portrait', 150)).toEqual({ width: 1240, height: 1754 })
  })

  it('pageSizePt: A4 = 595.28 × 841.89 pt', () => {
    const p = pageSizePt(paper('a4'), 'portrait')
    expect(p.width).toBeCloseTo(595.28, 2)
    expect(p.height).toBeCloseTo(841.89, 2)
    const l = pageSizePt(paper('a4'), 'landscape')
    expect(l.width).toBeCloseTo(841.89, 2)
    expect(l.height).toBeCloseTo(595.28, 2)
  })
})
