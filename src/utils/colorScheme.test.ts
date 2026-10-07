import { describe, expect, it } from 'vitest'
import { decodeScheme, encodeScheme, fitColorsToLayout } from './colorScheme'

describe('encodeScheme', () => {
  it('bez akcentu → sam schemat', () => {
    expect(encodeScheme('czern')).toBe('czern')
    expect(encodeScheme('czern', undefined)).toBe('czern')
  })
  it('z akcentem → schemat~akcent', () => {
    expect(encodeScheme('czern', 'pomaranczowy')).toBe('czern~pomaranczowy')
  })
  it('brak schematu → undefined (akcent bez schematu nie ma sensu)', () => {
    expect(encodeScheme(undefined, 'zloty')).toBeUndefined()
    expect(encodeScheme(undefined)).toBeUndefined()
  })
})

describe('decodeScheme', () => {
  it('null/pusty → oba undefined', () => {
    expect(decodeScheme(null)).toEqual({ scheme: undefined, accent: undefined })
    expect(decodeScheme('')).toEqual({ scheme: undefined, accent: undefined })
  })
  it('sam schemat', () => {
    expect(decodeScheme('czern')).toEqual({ scheme: 'czern', accent: undefined })
  })
  it('schemat~akcent', () => {
    expect(decodeScheme('czern~granatowy')).toEqual({ scheme: 'czern', accent: 'granatowy' })
  })
  it('nieznany akcent → odrzucony, schemat zostaje', () => {
    expect(decodeScheme('czern~bzdura')).toEqual({ scheme: 'czern', accent: undefined })
  })
  it('round-trip z encodeScheme', () => {
    for (const [s, a] of [['czern', 'zolty'], ['default', undefined], ['limonka', 'srebrny']] as const) {
      const enc = encodeScheme(s, a)
      expect(decodeScheme(enc ?? null)).toEqual({ scheme: s, accent: a })
    }
  })
})

describe('fitColorsToLayout', () => {
  it('brak schematu → pierwszy schemat layoutu', () => {
    expect(fitColorsToLayout('wyklad')).toEqual({ scheme: 'default', accent: undefined })
    expect(fitColorsToLayout('rekrutacja')).toEqual({ scheme: 'limonka', accent: undefined })
  })
  it('dozwolony akcent zostaje', () => {
    expect(fitColorsToLayout('wyklad', { scheme: 'czern', accent: 'zloty' })).toEqual({ scheme: 'czern', accent: 'zloty' })
  })
  it('akcent spoza osi schematu jest odpinany', () => {
    // Granatowe tło Wykładu nie dopuszcza granatowego akcentu.
    expect(fitColorsToLayout('wyklad', { scheme: 'default', accent: 'granatowy' })).toEqual({ scheme: 'default', accent: undefined })
    // Schemat stały (bez osi akcentu).
    expect(fitColorsToLayout('gosc', { scheme: 'szary', accent: 'zolty' })).toEqual({ scheme: 'szary', accent: undefined })
  })
  it('nieznany layout → bez schematu i bez akcentu', () => {
    expect(fitColorsToLayout(undefined, { accent: 'zolty' })).toEqual({ scheme: undefined, accent: undefined })
    expect(fitColorsToLayout('nieistnieje')).toEqual({ scheme: undefined, accent: undefined })
  })
})
