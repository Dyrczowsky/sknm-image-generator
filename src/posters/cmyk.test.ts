import { describe, expect, it } from 'vitest'
import { rgbaToCmyk } from './cmyk'

const px = (...rgb: number[]) => Array.from(rgbaToCmyk(new Uint8ClampedArray([...rgb, 255])))

describe('rgbaToCmyk', () => {
  it('biel → brak farby', () => {
    expect(px(255, 255, 255)).toEqual([0, 0, 0, 0])
  })
  it('czerń → sam K, bez dzielenia przez zero', () => {
    expect(px(0, 0, 0)).toEqual([0, 0, 0, 255])
  })
  it('czyste R / G / B', () => {
    expect(px(255, 0, 0)).toEqual([0, 255, 255, 0])
    expect(px(0, 255, 0)).toEqual([255, 0, 255, 0])
    expect(px(0, 0, 255)).toEqual([255, 255, 0, 0])
  })
  it('szarość → tylko K', () => {
    expect(px(128, 128, 128)).toEqual([0, 0, 0, 127])
  })
  it('kolor mieszany (granat marki #3C459B)', () => {
    // max = 155 → K = 100; C = (155-60)*255/155 = 156, M = (155-69)*255/155 = 141, Y = 0
    expect(px(0x3c, 0x45, 0x9b)).toEqual([156, 141, 0, 100])
  })
  it('alfa jest ignorowana, długość = 4 bajty na piksel', () => {
    const out = rgbaToCmyk(new Uint8ClampedArray([255, 0, 0, 0, 0, 0, 0, 10]))
    expect(Array.from(out)).toEqual([0, 255, 255, 0, 0, 0, 0, 255])
  })
})
