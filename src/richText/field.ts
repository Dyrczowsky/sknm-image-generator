// Logika pola RichEditable bez Reacta: stan pola i reakcje na zdarzenia.
// Wydzielona, żeby dało się ją testować na atrapie DOM.

import { getOffsets, isCanonical, rangeOffsets, readDoc, renderDoc, setOffsets } from './dom'
import type { Offsets } from './dom'
import type { ChangeMeta, FormatOp, ToolbarState } from './fieldRegistry'
import { MARK, toPlain } from './format'
import { alignIn, clearMarks, insertPlain, marksIn, mergeDomEdit, setAlign, splitLine, toggleMark } from './ops'

// Stan pola poza Reactem: treść jest niekontrolowana, a natywne zdarzenia
// (beforeinput, selectionchange) i rejestr paska czytają zawsze świeże propsy.
export interface Field {
  // Ostatnia wartość, którą pole wysłało albo dostało i narysowało. `value`
  // różne od niej = zmiana z zewnątrz (cofnij, panel) - przerysowujemy DOM.
  synced: string | null
  // Element, w którym ostatnio rysowaliśmy (zmiana `as` montuje nowy).
  el: HTMLElement | null
  inline: boolean
  composing: boolean
  // Zmiana z zewnątrz w trakcie kompozycji IME - rysowana po compositionend.
  deferred: string | null
  // Ostatnie zaznaczenie w polu - pasek działa też, gdy zaznaczenie na chwilę zniknęło.
  saved: Offsets | null
  onChange: (value: string, meta?: ChangeMeta) => void
  multiline: boolean
  alignable: boolean
}

export function createField(props: Pick<Field, 'onChange' | 'multiline' | 'alignable'>): Field {
  return { synced: null, el: null, inline: !props.alignable, composing: false, deferred: null, saved: null, ...props }
}

const FORMAT_MARKS: Record<string, number> = {
  formatBold: MARK.bold,
  formatItalic: MARK.italic,
  formatUnderline: MARK.underline,
  formatStrikeThrough: MARK.strike,
}
const KEY_MARKS: Record<string, number> = { b: MARK.bold, i: MARK.italic, u: MARK.underline }

export const isEmpty = (value: string) => toPlain(value) === ''

/** Znacznik dla skrótu ⌘B/I/U (Mac) albo Ctrl+B/I/U; null, gdy to nie skrót formatowania. */
export function shortcutMark(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>, mac: boolean,
): number | null {
  const mod = mac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
  if (!mod || event.shiftKey || event.altKey) return null
  return KEY_MARKS[event.key.toLowerCase()] ?? null
}

function offsetsOf(el: HTMLElement, f: Field): Offsets {
  const end = toPlain(f.synced ?? '').length
  return getOffsets(el) ?? f.saved ?? { start: end, end }
}

/** Wartość z zewnątrz (pierwszy render, cofnij, panel): rysuje DOM, zachowuje kursor przy fokusie. */
export function applyExternal(el: HTMLElement, f: Field, value: string, inline: boolean) {
  if (value === f.synced && inline === f.inline && el === f.el) return
  // W trakcie kompozycji IME przerysowanie zerwałoby wpisywanie - czekamy.
  if (f.composing && el === f.el) {
    f.deferred = value
    return
  }
  const focused = el.ownerDocument.activeElement === el
  const offsets = focused ? getOffsets(el) : null
  f.synced = value
  f.el = el
  f.inline = inline
  f.deferred = null
  renderDoc(el, value, { inline })
  el.toggleAttribute('data-empty', isEmpty(value))
  if (!focused) return
  const end = toPlain(value).length
  setOffsets(el, offsets?.start ?? end, offsets?.end ?? end)
}

/** Nowa wartość z operacji: rysuje DOM, ustawia zaznaczenie, zgłasza zmianę. */
function commit(el: HTMLElement, f: Field, next: string, start: number, end: number, meta?: ChangeMeta) {
  const changed = next !== f.synced
  f.synced = next
  if (changed) {
    renderDoc(el, next, { inline: f.inline })
    el.toggleAttribute('data-empty', isEmpty(next))
  }
  if (el.ownerDocument.activeElement === el) setOffsets(el, start, end)
  f.saved = { start, end }
  if (!changed) return
  if (meta) f.onChange(next, meta)
  else f.onChange(next)
}

/** DOM → wartość po zwykłym pisaniu. `canonize`: przerysuj, gdy przeglądarka dołożyła obcy kształt. */
export function syncFromDom(el: HTMLElement, f: Field, canonize: boolean) {
  const read = readDoc(el)
  // Pole inline nie ma w DOM wyrównań wierszy - bierzemy je z ostatniej wartości.
  // Pole jednowierszowe: nowe linie, które przecisnęła przeglądarka, to spacje
  // (te już zapisane, np. z innego układu, zostają).
  const next = f.inline || !f.multiline
    ? mergeDomEdit(f.synced ?? '', read, { multiline: f.multiline, keepAligns: f.inline })
    : read
  const force = toPlain(next) !== toPlain(read)
  el.toggleAttribute('data-empty', isEmpty(next))
  if (next !== f.synced) {
    f.synced = next
    f.onChange(next)
  }
  // W trakcie kompozycji (IME) nie ruszamy DOM - przerwałoby to wpisywanie.
  if (!canonize || f.composing) return
  if (force || !isCanonical(el, next, f.inline)) {
    const offsets = getOffsets(el)
    renderDoc(el, next, { inline: f.inline })
    if (offsets) setOffsets(el, offsets.start, offsets.end)
  }
}

/** Koniec kompozycji: odroczona zmiana z zewnątrz wygrywa, inaczej czytamy DOM. */
export function endComposition(el: HTMLElement, f: Field) {
  f.composing = false
  if (f.deferred !== null) applyExternal(el, f, f.deferred, f.inline)
  else syncFromDom(el, f, true)
}

export function applyFormat(el: HTMLElement, f: Field, op: FormatOp) {
  if (f.composing) return
  syncFromDom(el, f, false)
  const value = f.synced ?? ''
  const { start, end } = offsetsOf(el, f)
  let next = value
  if (op.kind === 'mark') next = toggleMark(value, start, end, op.mark)
  else if (op.kind === 'clear') next = clearMarks(value, start, end)
  else if (f.alignable) next = setAlign(value, start, end, op.align)
  commit(el, f, next, start, end, { kind: 'format' })
}

export function toolbarState(el: HTMLElement, f: Field): ToolbarState {
  const value = f.synced ?? ''
  const { start, end } = offsetsOf(el, f)
  return {
    marks: marksIn(value, start, end),
    align: f.alignable ? alignIn(value, start, end) : null,
    alignable: f.alignable,
  }
}

/** Wstawia czysty tekst (wklejanie) w miejscu zaznaczenia albo podanego zakresu. */
export function insertText(el: HTMLElement, f: Field, text: string, at?: Offsets) {
  syncFromDom(el, f, false)
  const range = at ?? offsetsOf(el, f)
  const result = insertPlain(f.synced ?? '', range.start, range.end, text, f.multiline)
  commit(el, f, result.value, result.caret, result.caret)
}

type BeforeInput = Pick<InputEvent, 'inputType' | 'isComposing' | 'data' | 'dataTransfer' | 'preventDefault'>
  & { getTargetRanges?: () => StaticRange[] }

export function onBeforeInput(el: HTMLElement, f: Field, event: BeforeInput) {
  if (event.isComposing || f.composing) return
  const type = event.inputType
  // Cofaniem steruje właściciel (Ctrl+Z idzie w górę jako keydown).
  if (type === 'historyUndo' || type === 'historyRedo') {
    event.preventDefault()
    return
  }
  // Formatowanie przeglądarki (execCommand, menu kontekstowe) zastępujemy własnym.
  if (type.startsWith('format')) {
    event.preventDefault()
    const mark = FORMAT_MARKS[type]
    if (mark) applyFormat(el, f, { kind: 'mark', mark })
    return
  }
  const handled = type === 'insertParagraph' || type === 'insertLineBreak' || type === 'insertFromPaste'
    || type === 'insertFromDrop' || type === 'insertFromPasteAsQuotation'
    || (type === 'insertText' && event.data !== null && /[\r\n\ue000-\ue1ff]/.test(event.data))
  if (!handled) return
  event.preventDefault()
  syncFromDom(el, f, false)
  const target = event.getTargetRanges?.()[0]
  const at = (target && rangeOffsets(el, target)) || offsetsOf(el, f)
  if (type === 'insertParagraph' || type === 'insertLineBreak') {
    if (!f.multiline) {
      el.blur()
      return
    }
    const result = splitLine(f.synced ?? '', at.start, at.end)
    commit(el, f, result.value, result.caret, result.caret)
    return
  }
  const text = type === 'insertText' ? event.data ?? '' : event.dataTransfer?.getData('text/plain') ?? event.data ?? ''
  insertText(el, f, text, at)
}
