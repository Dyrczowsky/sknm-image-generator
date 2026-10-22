import { describe, expect, it } from 'vitest'
import { leading } from './theme'

describe('leading', () => {
  it('ciasne tytuły dostają co najmniej 1,0 (ogonki nie dotykają liter wiersz niżej)', () => {
    expect(leading(0.94, 1)).toBe(1)
    expect(leading(0.88, 0.7)).toBe(1)
  })

  it('luźniejsza interlinia do 100% zostaje projektowa', () => {
    expect(leading(1.08, 1)).toBe(1.08)
    expect(leading(1.4, 0.85)).toBe(1.4)
  })

  it('powyżej 100% rośnie szybciej niż tekst: 130% → +0,06', () => {
    expect(leading(0.94, 1.3)).toBe(1.06)
    expect(leading(1.4, 1.3)).toBe(1.46)
    expect(leading(1.08, 1.15)).toBe(1.11)
  })
})
