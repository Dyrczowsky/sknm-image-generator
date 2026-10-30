import { describe, expect, it } from 'vitest'
import { MARK, parseRich, toPlain } from './format'
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
    expect(insertPlain('ab', 1, 1, 'x\n\ny\ue105', false)).toEqual({ value: 'ax yb', caret: 4 })
  })
  it('applyPlainEdit: z pustego i do pustego', () => {
    expect(applyPlainEdit('', 'a')).toBe('a')
    expect(applyPlainEdit('a', '')).toBe('')
  })
  it('insertPlain na początku wiersza dziedziczy marks znaku po', () => {
    const v = toggleMark('ab', 0, 1, B)
    expect(parseRich(insertPlain(v, 0, 0, 'x', false).value)[0].runs).toEqual([
      { text: 'xa', marks: B }, { text: 'b', marks: 0 }])
  })
  it('insertPlain w pustym wierszu nie dziedziczy marks z sąsiednich wierszy', () => {
    const v = toggleMark('a\n\nb', 0, 1, B)
    const doc = parseRich(insertPlain(v, 2, 2, 'x', false).value)
    expect(doc[1].runs).toEqual([{ text: 'x', marks: 0 }])
  })
  it('setAlign i alignIn na pustym tekście', () => {
    expect(parseRich(setAlign('', 0, 0, 'center'))).toEqual([{ align: 'center', runs: [] }])
    expect(alignIn('', 0, 0)).toBe('left')
  })
  it('zakres kończący się tuż po \\n dotyka tylko pierwszego wiersza', () => {
    const v = setAlign('a\nb', 2, 3, 'right')
    expect(alignIn(v, 0, 2)).toBe('left')
    expect(parseRich(setAlign('a\nb', 0, 2, 'center')).map((l) => l.align)).toEqual(['center', 'left'])
  })
  it('applyPlainEdit: usunięcie \\n łączy wiersze z wyrównaniem wcześniejszego', () => {
    const v = setAlign('a\nb', 2, 3, 'right')
    expect(parseRich(applyPlainEdit(v, 'ab')).map((l) => l.align)).toEqual(['left'])
    const w = setAlign('a\nb', 0, 1, 'center')
    expect(parseRich(applyPlainEdit(w, 'ab')).map((l) => l.align)).toEqual(['center'])
  })
  it('insertPlain zastępujący zaznaczenie wielowierszowe', () => {
    const v = setAlign('ab\ncd\nef', 3, 4, 'right')
    const r = insertPlain(v, 1, 7, 'X', true)
    expect(toPlain(r.value)).toBe('aXf')
    expect(r.caret).toBe(2)
    expect(parseRich(r.value).map((l) => l.align)).toEqual(['left'])
  })
  it('insertPlain w trybie wielowierszowym normalizuje \\r\\n i \\r do \\n', () => {
    expect(insertPlain('', 0, 0, 'a\r\nb\rc', true)).toEqual({ value: 'a\nb\nc', caret: 5 })
  })
})
