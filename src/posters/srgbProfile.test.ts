import { describe, expect, it } from 'vitest'
import { buildSrgbProfile } from './srgbProfile'

const profile = buildSrgbProfile()
const view = new DataView(profile.buffer)
const text = new TextDecoder('latin1').decode(profile)

// Wpisy tablicy tagów: sygnatura → [offset, długość].
const tags = new Map<string, [number, number]>()
for (let i = 0; i < view.getUint32(128); i++) {
  const at = 132 + i * 12
  tags.set(text.slice(at, at + 4), [view.getUint32(at + 4), view.getUint32(at + 8)])
}

describe('buildSrgbProfile', () => {
  it('nagłówek: rozmiar, wersja 2.1, monitor RGB → XYZ', () => {
    expect(view.getUint32(0)).toBe(profile.length)
    expect(view.getUint32(8)).toBe(0x02100000)
    expect(text.slice(12, 24)).toBe('mntrRGB XYZ ')
    expect(text.slice(36, 40)).toBe('acsp')
  })

  it('komplet tagów profilu macierzowego, w granicach pliku i wyrównanych do 4 bajtów', () => {
    expect([...tags.keys()]).toEqual(['desc', 'cprt', 'wtpt', 'rXYZ', 'gXYZ', 'bXYZ', 'rTRC', 'gTRC', 'bTRC'])
    for (const [offset, length] of tags.values()) {
      expect(offset % 4).toBe(0)
      expect(offset + length).toBeLessThanOrEqual(profile.length)
    }
  })

  it('barwy podstawowe sumują się do bieli D50', () => {
    const xyz = (name: string) => [0, 1, 2].map((i) => view.getInt32(tags.get(name)![0] + 8 + i * 4) / 65536)
    const sum = [0, 1, 2].map((i) => xyz('rXYZ')[i] + xyz('gXYZ')[i] + xyz('bXYZ')[i])
    xyz('wtpt').forEach((white, i) => expect(sum[i]).toBeCloseTo(white, 3))
  })

  it('krzywa sRGB: od 0 do 1, a szarość 50% to ok. 21,4% światła', () => {
    const [offset] = tags.get('rTRC')!
    const count = view.getUint32(offset + 8)
    const sample = (i: number) => view.getUint16(offset + 12 + i * 2) / 65535
    expect(sample(0)).toBe(0)
    expect(sample(count - 1)).toBe(1)
    expect(sample(Math.round((count - 1) / 2))).toBeCloseTo(0.214, 2)
    expect(tags.get('gTRC')).toEqual(tags.get('rTRC'))
  })
})
