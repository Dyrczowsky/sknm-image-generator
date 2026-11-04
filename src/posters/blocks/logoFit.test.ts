import { describe, expect, it } from 'vitest'
import { fitLogoHeight, logoRowWidth } from './logoFit'

const base = { wanted: 72, min: 48, avail: 600, qrInRow: false, clear: 12 }
// Szerokość rzędu przy wysokości h - ten sam wzór co w FooterLogos.
const rowWidth = (h: number, ratios: number[], qr: boolean, c = 12) => {
  const k = ratios.length + (qr ? 1 : 0)
  return h * (ratios.reduce((a, b) => a + b, 0) + (qr ? 1 : 0)) + 2 * c * k + c * (k - 1) - c
}

describe('fitLogoHeight', () => {
  it('samo logo PK: pełna wysokość treści stopki', () => {
    expect(fitLogoHeight({ ...base, ratios: [4.5] })).toBe(72)
  })

  it('więcej sponsorów: maleje tak, żeby zmieścić się w jednym rzędzie', () => {
    const ratios = [4.5, 2, 2, 1.5]
    const h = fitLogoHeight({ ...base, ratios })
    expect(h).toBeLessThan(72)
    expect(h).toBeGreaterThanOrEqual(48)
    expect(rowWidth(h, ratios, false)).toBeLessThanOrEqual(600)
  })

  it('kod QR przy logotypach też zajmuje miejsce w rzędzie', () => {
    const ratios = [4.5, 2]
    expect(fitLogoHeight({ ...base, ratios, qrInRow: true })).toBeLessThan(fitLogoHeight({ ...base, ratios }))
  })

  it('nie schodzi poniżej minimum - wtedy rząd zawija się jak dawniej', () => {
    expect(fitLogoHeight({ ...base, ratios: [4.5, 4, 4, 4, 4] })).toBe(48)
  })

  it('grafika jeszcze się nie wczytała: zostaje wysokość treści', () => {
    expect(fitLogoHeight({ ...base, ratios: [4.5, undefined] })).toBe(72)
  })

  it('treść niższa od minimum: minimum', () => {
    expect(fitLogoHeight({ ...base, wanted: 30, ratios: [4.5] })).toBe(48)
  })
})

describe('logoRowWidth', () => {
  it('zgadza się z wysokością dobraną przez fitLogoHeight', () => {
    const ratios = [4.5, 2, 2, 1.5]
    const h = fitLogoHeight({ ...base, ratios })
    expect(logoRowWidth(h, ratios, false, 12)).toBeLessThanOrEqual(600)
    expect(logoRowWidth(h + 1, ratios, false, 12)).toBeGreaterThan(600)
  })

  it('bez wczytanych proporcji - brak wyniku (stopka się nie piętrzy na ślepo)', () => {
    expect(logoRowWidth(48, [4.5, undefined], false, 12)).toBeNull()
  })
})
