import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOffsets } from './dom'
import {
  applyExternal, applyFormat, createField, endComposition, insertText, onBeforeInput, restoreFocus, saveSelection,
  shortcutMark, syncFromDom, toolbarState,
} from './field'
import { MARK } from './format'
import { asEl, e, fakeDocument, inner, root, select, t } from './testDom'
import type { FakeNode } from './testDom'

const RICH = '\ue000'
const CENTER = '\ue001'
const style = (marks: number) => String.fromCharCode(0xe100 + marks)
const B = MARK.bold

// Pole z fokusem i narysowaną wartością.
function setup(value: string, opts: { multiline?: boolean; alignable?: boolean } = {}) {
  const onChange = vi.fn()
  const f = createField({ onChange, multiline: opts.multiline ?? false, alignable: opts.alignable ?? false })
  const el = root()
  applyExternal(asEl(el), f, value, !f.alignable)
  fakeDocument.activeElement = el
  return { el, f, onChange }
}

// Zaznaczenie po offsetach tekstu (przez pierwszy węzeł tekstowy).
function selectText(el: FakeNode, start: number, end = start) {
  const node = el.childNodes[0]
  select([node, start], [node, end])
}

function input(inputType: string, data: string | null = null) {
  return { inputType, isComposing: false, data, dataTransfer: null, preventDefault: vi.fn() }
}

beforeEach(() => {
  fakeDocument.activeElement = null
})

describe('Enter', () => {
  it('pole wielowierszowe: splitLine, kursor na początku nowego wiersza', () => {
    const { el, f, onChange } = setup('abcd', { multiline: true })
    selectText(el, 2)
    const event = input('insertParagraph')
    onBeforeInput(asEl(el), f, event)
    expect(event.preventDefault).toHaveBeenCalled()
    // Pisanie (tu Enter) bez drugiego argumentu - skleja się w historii.
    expect(onChange).toHaveBeenCalledWith('ab\ncd')
    expect(onChange.mock.calls[0]).toHaveLength(1)
    expect(inner(el)).toBe('ab\ncd')
    expect(getOffsets(asEl(el))).toEqual({ start: 3, end: 3 })
  })

  it('Enter na końcu: pusty ostatni wiersz z <br>, kursor w nim', () => {
    const { el, f, onChange } = setup('ab', { multiline: true })
    selectText(el, 2)
    onBeforeInput(asEl(el), f, input('insertLineBreak'))
    expect(onChange).toHaveBeenCalledWith('ab\n')
    expect(inner(el)).toBe('ab\n<br>')
    expect(getOffsets(asEl(el))).toEqual({ start: 3, end: 3 })
  })

  it('pole jednowierszowe: blur bez zmiany wartości', () => {
    const { el, f, onChange } = setup('abcd')
    selectText(el, 2)
    const event = input('insertParagraph')
    onBeforeInput(asEl(el), f, event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(fakeDocument.activeElement).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('wklejanie', () => {
  it('tekst wielowierszowy w polu jednowierszowym: wiersze sklejone spacją', () => {
    const { el, f, onChange } = setup('ab')
    selectText(el, 1)
    insertText(asEl(el), f, 'x\r\ny')
    expect(onChange).toHaveBeenCalledWith('ax yb')
    expect(getOffsets(asEl(el))).toEqual({ start: 4, end: 4 })
  })

  it('wklejony tekst dziedziczy styl, znaki sterujące odpadają (beforeinput insertFromPaste)', () => {
    const { el, f, onChange } = setup(`${RICH}${style(B)}ab`, { multiline: true })
    const span = el.childNodes[0].childNodes[0]
    select([span, 1])
    const event = { ...input('insertFromPaste'), dataTransfer: { getData: () => `x\n${CENTER}y` } }
    onBeforeInput(asEl(el), f, event as unknown as InputEvent)
    expect(onChange).toHaveBeenCalledWith(`${RICH}${style(B)}ax\n${style(B)}yb`)
  })
})

describe('applyFormat i state', () => {
  it('pogrubienie zaznaczenia: nowa wartość, span w DOM i to samo zaznaczenie', () => {
    const { el, f, onChange } = setup('Ala ma kota')
    selectText(el, 4, 6)
    applyFormat(asEl(el), f, { kind: 'mark', mark: B })
    // Drugi argument: zmiana z paska - w historii slajdów osobny krok.
    expect(onChange).toHaveBeenCalledWith(`${RICH}Ala ${style(B)}ma${style(0)} kota`, { kind: 'format' })
    expect(inner(el)).toContain('<span data-marks="1" style="fontWeight:bolder">ma</span>')
    expect(getOffsets(asEl(el))).toEqual({ start: 4, end: 6 })
    expect(toolbarState(asEl(el), f)).toEqual({ marks: B, align: null, alignable: false })
  })

  it('wyrównanie tylko w polu alignable', () => {
    const plain = setup('ab')
    selectText(plain.el, 1)
    applyFormat(asEl(plain.el), plain.f, { kind: 'align', align: 'center' })
    expect(plain.onChange).not.toHaveBeenCalled()

    const { el, f, onChange } = setup('ab', { alignable: true })
    selectText(el, 1)
    applyFormat(asEl(el), f, { kind: 'align', align: 'center' })
    expect(onChange).toHaveBeenCalledWith(`${RICH}${CENTER}ab`, { kind: 'format' })
    expect(toolbarState(asEl(el), f)).toEqual({ marks: 0, align: 'center', alignable: true })
  })

  it('bez zaznaczenia w polu: ostatnie zapamiętane zaznaczenie', () => {
    const { el, f, onChange } = setup('abc')
    f.saved = { start: 0, end: 1 }
    select([root(t('x')), 0])
    applyFormat(asEl(el), f, { kind: 'mark', mark: MARK.italic })
    expect(onChange).toHaveBeenCalledWith(`${RICH}${style(MARK.italic)}a${style(0)}bc`, { kind: 'format' })
  })

  it('beforeinput formatBold idzie przez applyFormat, historyUndo jest blokowane', () => {
    const { el, f, onChange } = setup('ab')
    selectText(el, 0, 2)
    const bold = input('formatBold')
    onBeforeInput(asEl(el), f, bold)
    expect(bold.preventDefault).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(`${RICH}${style(B)}ab`, { kind: 'format' })
    const undo = input('historyUndo')
    onBeforeInput(asEl(el), f, undo)
    expect(undo.preventDefault).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})

describe('pisanie i kompozycja IME', () => {
  it('pisanie w spanie: wartość z DOM, bez przerysowania', () => {
    const { el, f, onChange } = setup(`${RICH}${style(B)}ab`)
    const span = el.childNodes[0]
    span.childNodes[0].nodeValue = 'axb'
    syncFromDom(asEl(el), f, true)
    expect(onChange).toHaveBeenCalledWith(`${RICH}${style(B)}axb`)
    expect(el.childNodes[0]).toBe(span)
  })

  it('obcy znacznik przeglądarki: przerysowanie do kształtu kanonicznego', () => {
    const { el, f } = setup('a')
    el.replaceChildren(t('a'), e('b', {}, t('x')))
    syncFromDom(asEl(el), f, true)
    expect(inner(el)).toBe('a<span data-marks="1" style="fontWeight:bolder">x</span>')
  })

  it('w trakcie kompozycji DOM nie jest ruszany, zmiana z zewnątrz czeka na compositionend', () => {
    const { el, f } = setup('a')
    f.composing = true
    el.replaceChildren(t('a'), e('b', {}, t('x')))
    syncFromDom(asEl(el), f, true)
    expect(inner(el)).toBe('a<b>x</b>')
    applyExternal(asEl(el), f, 'zzz', true)
    expect(inner(el)).toBe('a<b>x</b>')
    endComposition(asEl(el), f)
    expect(inner(el)).toBe('zzz')
    expect(f.synced).toBe('zzz')
  })

  it('beforeinput w trakcie kompozycji jest ignorowany', () => {
    const { el, f } = setup('a', { multiline: true })
    f.composing = true
    const event = input('insertParagraph')
    onBeforeInput(asEl(el), f, event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})

describe('shortcutMark', () => {
  const key = (k: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>>) =>
    ({ key: k, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods })

  it('Mac: tylko ⌘, inne systemy: tylko Ctrl', () => {
    expect(shortcutMark(key('b', { metaKey: true }), true)).toBe(B)
    expect(shortcutMark(key('b', { ctrlKey: true }), true)).toBeNull()
    expect(shortcutMark(key('I', { ctrlKey: true }), false)).toBe(MARK.italic)
    expect(shortcutMark(key('u', { metaKey: true }), false)).toBeNull()
  })

  it('Shift, Alt i inne klawisze to nie skrót formatowania', () => {
    expect(shortcutMark(key('b', { ctrlKey: true, shiftKey: true }), false)).toBeNull()
    expect(shortcutMark(key('b', { ctrlKey: true, altKey: true }), false)).toBeNull()
    expect(shortcutMark(key('k', { ctrlKey: true }), false)).toBeNull()
  })
})

describe('pole inline: wyrównanie wierszy z zapisu', () => {
  // Zapis z innego układu: drugi wiersz wyśrodkowany, pole tutaj inline (bez bloków).
  const stored = `${RICH}ab\n${CENTER}cd`

  it('fokus i blur bez zmian nie wołają onChange', () => {
    const { el, f, onChange } = setup(stored, { multiline: true })
    expect(inner(el)).toBe('ab\ncd')
    syncFromDom(asEl(el), f, false)
    syncFromDom(asEl(el), f, true)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('pisanie zachowuje wyrównanie wierszy', () => {
    const { el, f, onChange } = setup(stored, { multiline: true })
    el.childNodes[0].nodeValue = 'abx\ncd'
    syncFromDom(asEl(el), f, true)
    expect(onChange).toHaveBeenCalledWith(`${RICH}abx\n${CENTER}cd`)
  })

  it('usunięcie podziału wiersza: wiersz dostaje wyrównanie pierwszego', () => {
    const { el, f, onChange } = setup(stored, { multiline: true })
    el.childNodes[0].nodeValue = 'abcd'
    syncFromDom(asEl(el), f, true)
    expect(onChange).toHaveBeenCalledWith('abcd')
  })

  it('pogrubienie zachowuje wyrównanie', () => {
    const { el, f, onChange } = setup(stored, { multiline: true })
    selectText(el, 0, 2)
    applyFormat(asEl(el), f, { kind: 'mark', mark: B })
    expect(onChange).toHaveBeenCalledWith(`${RICH}${style(B)}ab\n${CENTER}cd`, { kind: 'format' })
  })
})

describe('pole jednowierszowe z \\n w zapisie', () => {
  it('fokus i blur bez zmian nie wołają onChange', () => {
    const { el, f, onChange } = setup('a\nb')
    syncFromDom(asEl(el), f, false)
    syncFromDom(asEl(el), f, true)
    expect(onChange).not.toHaveBeenCalled()
    expect(inner(el)).toBe('a\nb')
  })

  it('pisanie zachowuje istniejący \\n', () => {
    const { el, f, onChange } = setup('a\nb')
    el.childNodes[0].nodeValue = 'a\nbx'
    syncFromDom(asEl(el), f, true)
    expect(onChange).toHaveBeenCalledWith('a\nbx')
  })

  it('nowy \\n wciśnięty przez przeglądarkę zamienia się w spację', () => {
    const { el, f, onChange } = setup('a\nbc')
    el.childNodes[0].nodeValue = 'a\nb\n\nc'
    syncFromDom(asEl(el), f, true)
    expect(onChange).toHaveBeenCalledWith('a\nb c')
    expect(inner(el)).toBe('a\nb c')
  })

  it('pole z blokami (alignable): nowy \\n spacją, wyrównania z DOM', () => {
    const { el, f, onChange } = setup(`${RICH}${CENTER}ab`, { alignable: true })
    el.replaceChildren(e('div', { 'data-align': 'center' }, t('a')), e('div', { 'data-align': 'center' }, t('b')))
    syncFromDom(asEl(el), f, true)
    expect(onChange).toHaveBeenCalledWith(`${RICH}${CENTER}a b`)
  })
})

describe('fokus w pasku (Alt+F10)', () => {
  it('saveSelection zapisuje zaznaczenie tylko, gdy pole ma fokus', () => {
    const { el, f } = setup('abcd')
    selectText(el, 1, 3)
    saveSelection(asEl(el), f)
    expect(f.saved).toEqual({ start: 1, end: 3 })
    // Fokus w pasku, a przerysowanie po blur zwinęło zaznaczenie w polu.
    fakeDocument.activeElement = root()
    selectText(el, 0)
    saveSelection(asEl(el), f)
    expect(f.saved).toEqual({ start: 1, end: 3 })
  })

  it('applyFormat z fokusem w pasku działa na zapamiętanym zaznaczeniu', () => {
    const { el, f, onChange } = setup('abcd')
    f.saved = { start: 1, end: 3 }
    fakeDocument.activeElement = root()
    selectText(el, 0)
    applyFormat(asEl(el), f, { kind: 'mark', mark: B })
    expect(onChange).toHaveBeenCalledWith(`${RICH}a${style(B)}bc${style(0)}d`, { kind: 'format' })
    expect(toolbarState(asEl(el), f).marks).toBe(B)
  })

  it('restoreFocus oddaje fokus polu i przywraca zaznaczenie', () => {
    const { el, f } = setup('abcd')
    f.saved = { start: 1, end: 3 }
    fakeDocument.activeElement = root()
    restoreFocus(asEl(el), f)
    expect(fakeDocument.activeElement).toBe(el)
    expect(getOffsets(asEl(el))).toEqual({ start: 1, end: 3 })
  })
})
