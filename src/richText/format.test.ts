import { describe, expect, it } from 'vitest'
import { MARK, parseRich, serializeRich, stripControl, toPlain, hasFormatting, hasAlignment, isRich, type RichDoc } from './format'

describe('format tekstu z formatowaniem', () => {
  it('zwykły string to jeden wiersz na linię bez stylów', () => {
    expect(parseRich('Ala <b>&amp;\nkot')).toEqual([
      { align: 'left', runs: [{ text: 'Ala <b>&amp;', marks: 0 }] },
      { align: 'left', runs: [{ text: 'kot', marks: 0 }] },
    ])
  })
  it('obieg parse → serialize zachowuje formatowanie', () => {
    const doc: RichDoc = [
      { align: 'center', runs: [{ text: 'Ala ', marks: 0 }, { text: 'ma', marks: MARK.bold | MARK.accent }] },
      { align: 'left', runs: [{ text: 'kota', marks: MARK.italic }] },
    ]
    expect(parseRich(serializeRich(doc))).toEqual(doc)
    expect(serializeRich(doc).startsWith('')).toBe(true)
    expect(isRich(serializeRich(doc))).toBe(true)
  })
  it('dokument bez formatowania serializuje się do zwykłego stringa', () => {
    expect(serializeRich(parseRich('a\nb'))).toBe('a\nb')
  })
  it('toPlain zdejmuje wszystkie znaczniki', () => {
    expect(toPlain(serializeRich([{ align: 'right', runs: [{ text: 'x', marks: MARK.strike }] }]))).toBe('x')
    expect(toPlain('zwykły\ntekst')).toBe('zwykły\ntekst')
  })
  it('uszkodzone znaczniki nie gubią tekstu', () => {
    expect(toPlain('abc')).toBe('abc')
    expect(toPlain('abcd')).toBe('abcd')
  })
  it('sąsiednie runy o tych samych stylach są łączone', () => {
    const s = serializeRich([{ align: 'left', runs: [{ text: 'a', marks: 1 }, { text: 'b', marks: 1 }] }])
    expect(parseRich(s)[0].runs).toEqual([{ text: 'ab', marks: 1 }])
  })
  it('stripControl usuwa znaki sterujące z wklejonego tekstu', () => {
    expect(stripControl('abc')).toBe('abc')
    expect(stripControl('abcd')).toBe('abcd')
  })
  it('pusty string i puste wiersze dają co najmniej jeden wiersz', () => {
    expect(parseRich('')).toEqual([{ align: 'left', runs: [] }])
    expect(parseRich('a\n\nb')).toHaveLength(3)
  })
  it('samo wyrównanie wymusza zapis wzbogacony', () => {
    const doc: RichDoc = [{ align: 'right', runs: [{ text: 'x', marks: 0 }] }]
    expect(hasAlignment(doc)).toBe(true)
    expect(hasFormatting(doc)).toBe(false)
    expect(parseRich(serializeRich(doc))).toEqual(doc)
  })
  it('styl 0 po pogrubieniu jest zapisywany, a na początku wiersza nie', () => {
    const s = serializeRich([{ align: 'left', runs: [{ text: 'a', marks: 0 }, { text: 'b', marks: 1 }, { text: 'c', marks: 0 }] }])
    expect(s).toBe('abc')
  })
})
