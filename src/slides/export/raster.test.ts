import { describe, expect, it } from 'vitest'
import { deckFileName, rasterSize } from './raster'

describe('deckFileName', () => {
  it('zostawia polskie litery', () => {
    expect(deckFileName('Zażółć gęślą jaźń')).toBe('Zażółć gęślą jaźń')
  })
  it('zamienia znaki niedozwolone', () => {
    expect(deckFileName('a/b:c*d?e"f<g>h|i')).toBe('a_b_c_d_e_f_g_h_i')
  })
  it('przycina białe znaki', () => {
    expect(deckFileName('  Wykład  ')).toBe('Wykład')
  })
  it('pusta nazwa daje domyślną', () => {
    expect(deckFileName('')).toBe('prezentacja')
    expect(deckFileName('   ')).toBe('prezentacja')
  })
})

describe('rasterSize', () => {
  it('16:9 to 1920x1080 px i 1440x810 pt', () => {
    expect(rasterSize('16:9')).toEqual({ width: 1920, height: 1080, widthPt: 1440, heightPt: 810 })
  })
  it('1:1 to 1080x1080 px i 810x810 pt', () => {
    expect(rasterSize('1:1')).toEqual({ width: 1080, height: 1080, widthPt: 810, heightPt: 810 })
  })
})
