import { describe, expect, it } from 'vitest'
import { MARK, parseRich } from './format'
import {
  alignIn, applyPlainEdit, clearMarks, insertPlain, marksIn, setAlign, splitLine, toggleMark,
} from './ops'

const B = MARK.bold

describe('operacje na zakresie', () => {
  it('toggleMark pogrubia tylko zaznaczony fragment', () => {
    expect(parseRich(toggleMark('Ala ma kota', 4, 6, B))[0].runs).toEqual([
      { text: 'Ala ', marks: 0 }, { text: 'ma', marks: B }, { text: ' kota', marks: 0 }])
  })
  it('toggleMark na w pełni pogrubionym zakresie zdejmuje styl i wraca do zwykłego stringa', () => {
    expect(toggleMark(toggleMark('abc', 0, 3, B), 0, 3, B)).toBe('abc')
  })
  it('toggleMark na częściowo pogrubionym zakresie pogrubia całość', () => {
    expect(marksIn(toggleMark(toggleMark('abcd', 0, 2, B), 0, 4, B), 0, 4) & B).toBe(B)
  })
  it('marksIn dla pustego zakresu zwraca 0', () => {
    expect(marksIn(toggleMark('abc', 0, 3, B), 1, 1)).toBe(0)
  })
  it('setAlign zmienia tylko wiersze dotknięte zaznaczeniem', () => {
    const doc = parseRich(setAlign('a\nb\nc', 2, 3, 'center'))
    expect(doc.map((l) => l.align)).toEqual(['left', 'center', 'left'])
  })
  it('alignIn zwraca null przy różnych wyrównaniach', () => {
    expect(alignIn(setAlign('a\nb', 0, 1, 'right'), 0, 3)).toBeNull()
  })
  it('alignIn dla kursora zwraca wyrównanie jego wiersza', () => {
    expect(alignIn(setAlign('a\nb', 2, 2, 'right'), 2, 2)).toBe('right')
  })
  it('clearMarks zostawia wyrównanie', () => {
    const v = clearMarks(setAlign(toggleMark('abc', 0, 3, B), 0, 0, 'right'), 0, 3)
    expect(parseRich(v)).toEqual([{ align: 'right', runs: [{ text: 'abc', marks: 0 }] }])
  })
  it('applyPlainEdit: tekst dopisany za pogrubieniem jest pogrubiony, reszta bez zmian', () => {
    const v = applyPlainEdit(toggleMark('Ala kot', 0, 3, B), 'Alaaa kot')
    expect(parseRich(v)[0].runs).toEqual([{ text: 'Alaaa', marks: B }, { text: ' kot', marks: 0 }])
  })
  it('applyPlainEdit: usunięcie fragmentu zabiera jego formatowanie', () => {
    expect(applyPlainEdit(toggleMark('Ala kot', 0, 3, B), ' kot')).toBe(' kot')
  })
  it('applyPlainEdit: wyrównania idą za wierszami przy dopisaniu wiersza na początku', () => {
    const v = applyPlainEdit(setAlign('a\nb', 2, 3, 'right'), 'x\na\nb')
    expect(parseRich(v).map((l) => l.align)).toEqual(['left', 'left', 'right'])
  })
  it('splitLine: nowy wiersz dziedziczy wyrównanie', () => {
    const { value, caret } = splitLine(setAlign('abcd', 0, 0, 'center'), 2, 2)
    expect(parseRich(value).map((l) => l.align)).toEqual(['center', 'center'])
    expect(caret).toBe(3)
  })
  it('insertPlain: wklejone wiersze w polu jednowierszowym sklejone spacją, bez znaków sterujących', () => {
    expect(insertPlain('ab', 1, 1, 'x\n\ny', false)).toEqual({ value: 'ax yb', caret: 4 })
  })
})
