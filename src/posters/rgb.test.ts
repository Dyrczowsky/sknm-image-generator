import { describe, expect, it } from 'vitest'
import { rgbaToRgb } from './rgb'

describe('rgbaToRgb', () => {
  it('kolor przechodzi bez zmian (granat marki #3C459B)', () => {
    expect(Array.from(rgbaToRgb(new Uint8ClampedArray([0x3c, 0x45, 0x9b, 255])))).toEqual([0x3c, 0x45, 0x9b])
  })
  it('alfa jest ignorowana, długość = 3 bajty na piksel', () => {
    const out = rgbaToRgb(new Uint8ClampedArray([255, 0, 0, 0, 1, 2, 3, 10]))
    expect(Array.from(out)).toEqual([255, 0, 0, 1, 2, 3])
  })
  it('pusty obraz', () => {
    expect(rgbaToRgb(new Uint8ClampedArray(0)).length).toBe(0)
  })
})
