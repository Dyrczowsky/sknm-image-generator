import { describe, expect, it } from 'vitest'
import { findFitFactor } from './fitFactor'

describe('findFitFactor', () => {
  it('mieści się w pełnym rozmiarze: 1, bez przepełnienia', () => {
    expect(findFitFactor(() => false)).toEqual({ factor: 1, overflowing: false })
  })

  it('nie mieści się nigdy: minimum i przepełnienie', () => {
    expect(findFitFactor(() => true)).toEqual({ factor: 0.7, overflowing: true })
    expect(findFitFactor(() => true, 0.5)).toEqual({ factor: 0.5, overflowing: true })
  })

  it('próg: największy mieszczący się mnożnik z dokładnością 0,01', () => {
    for (const threshold of [0.71, 0.8333, 0.9, 0.999]) {
      const result = findFitFactor((factor) => factor > threshold)
      expect(result.overflowing).toBe(false)
      expect(result.factor).toBeLessThanOrEqual(threshold)
      expect(threshold - result.factor).toBeLessThan(0.01)
      // Trzy miejsca po przecinku - krótki zapis w atrybucie `style`.
      expect(String(result.factor).length).toBeLessThanOrEqual(5)
    }
  })
})
