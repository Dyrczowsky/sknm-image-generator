import { beforeEach, describe, expect, it } from 'vitest'
import { refOf, register, resetRegistry, srcOf } from './registry'

const REF = `${'a'.repeat(64)}.png`
const SRC = 'data:image/png;base64,AAAA'

describe('rejestr grafik', () => {
  beforeEach(resetRegistry)

  it('szuka w obie strony', () => {
    register(REF, SRC)
    expect(srcOf(REF)).toBe(SRC)
    expect(refOf(SRC)).toBe(REF)
  })

  it('nieznane wartości → undefined', () => {
    expect(srcOf(REF)).toBeUndefined()
    expect(refOf(SRC)).toBeUndefined()
  })

  it('resetRegistry czyści obie mapy', () => {
    register(REF, SRC)
    resetRegistry()
    expect(srcOf(REF)).toBeUndefined()
    expect(refOf(SRC)).toBeUndefined()
  })
})
