import { describe, expect, it } from 'vitest'
import { SHAPE_SIZE } from '../posters/shape'
import type { PosterShape } from '../types'
import { fitWidth, stagePadding, tileGrid } from './fit'

describe('fitWidth', () => {
  it('niezmierzone pudełko daje 0', () => {
    expect(fitWidth({ width: 0, height: 0 }, SHAPE_SIZE.square)).toBe(0)
    expect(fitWidth({ width: 400, height: 0 }, SHAPE_SIZE.square)).toBe(0)
  })

  it('kwadrat ogranicza krótszy bok pudełka', () => {
    expect(fitWidth({ width: 900, height: 600 }, SHAPE_SIZE.square)).toBe(600)
    expect(fitWidth({ width: 400, height: 700 }, SHAPE_SIZE.square)).toBe(400)
  })

  it('margines jest odejmowany z obu stron', () => {
    expect(fitWidth({ width: 900, height: 600 }, SHAPE_SIZE.square, 20)).toBe(560)
    expect(fitWidth({ width: 30, height: 600 }, SHAPE_SIZE.square, 20)).toBe(0)
  })

  it('każdy kształt mieści się w pudełku w obu wymiarach', () => {
    const boxes = [{ width: 960, height: 730 }, { width: 560, height: 650 }, { width: 358, height: 500 }, { width: 1400, height: 300 }]
    for (const box of boxes) {
      for (const shape of Object.keys(SHAPE_SIZE) as PosterShape[]) {
        const { width, height } = SHAPE_SIZE[shape]
        const fitted = fitWidth(box, SHAPE_SIZE[shape], 12)
        expect(fitted, shape).toBeGreaterThan(0)
        expect(fitted, shape).toBeLessThanOrEqual(box.width - 24)
        expect((fitted * height) / width, shape).toBeLessThanOrEqual(box.height - 24)
        // …i wypełnia je do końca w co najmniej jednym wymiarze.
        const slackW = box.width - 24 - fitted
        const slackH = box.height - 24 - (fitted * height) / width
        expect(Math.min(slackW, slackH), shape).toBeLessThan(2)
      }
    }
  })
})

describe('stagePadding', () => {
  it('4% krótszego boku w granicach 8-28 px', () => {
    expect(stagePadding({ width: 358, height: 358 })).toBe(14)
    expect(stagePadding({ width: 120, height: 900 })).toBe(8)
    expect(stagePadding({ width: 1600, height: 1200 })).toBe(28)
  })
})

describe('tileGrid', () => {
  it('przed pomiarem nie ma kolumn', () => {
    expect(tileGrid(0, 116, 8)).toEqual({ columns: 0, tile: 0 })
  })

  it('tyle kolumn, ile się mieści, zawsze co najmniej jedna', () => {
    expect(tileGrid(440, 116, 8)).toEqual({ columns: 3, tile: 141 })
    expect(tileGrid(308, 116, 8)).toEqual({ columns: 2, tile: 150 })
    expect(tileGrid(90, 116, 8)).toEqual({ columns: 1, tile: 90 })
  })

  it('kolumny z odstępami mieszczą się w szerokości', () => {
    for (const width of [300, 358, 412, 440, 700, 1392]) {
      const { columns, tile } = tileGrid(width, 116, 8)
      expect(columns * tile + (columns - 1) * 8).toBeLessThanOrEqual(width)
    }
  })
})
