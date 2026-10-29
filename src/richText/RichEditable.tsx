import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ClipboardEvent, CSSProperties, KeyboardEvent, ReactElement, Ref } from 'react'
import { getOffsets, isCanonical, placeCaretAtEnd, rangeOffsets, readDoc, renderDoc, setOffsets } from './dom'
import type { Offsets } from './dom'
import { registerRichField } from './fieldRegistry'
import type { FormatOp, ToolbarState } from './fieldRegistry'
import { MARK, toPlain } from './format'
import { alignIn, applyPlainEdit, clearMarks, insertPlain, marksIn, setAlign, splitLine, toggleMark } from './ops'

export type EditableTag = 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'b' | 'i' | 'figcaption'

export interface RichEditableProps {
  value: string
  onChange: (value: string) => void
  as?: EditableTag
  style?: CSSProperties
  multiline?: boolean
  // Czy pole obsługuje wyrównanie wierszy (domyślnie false → przyciski wyszarzone).
  alignable?: boolean
  placeholder?: string
  ariaLabel: string
  // Atrybut, po którym pasek i CSS rozpoznają pole (np. 'data-slide-edit').
  marker: 'data-slide-edit' | 'data-poster-edit'
  // Dodatkowa obsługa klawiszy przed domyślną (np. blokada cofania na plakacie).
  onKeyDownCapture?: (event: KeyboardEvent<HTMLElement>) => void
}

// Stan pola poza Reactem: treść jest niekontrolowana, a natywne zdarzenia
// (beforeinput, selectionchange) i rejestr paska czytają zawsze świeże propsy.
interface Field {
  // Ostatnia wartość, którą pole wysłało albo dostało i narysowało. `value`
  // różne od niej = zmiana z zewnątrz (cofnij, panel) - przerysowujemy DOM.
  synced: string | null
  inline: boolean
  composing: boolean
  // Ostatnie zaznaczenie w polu - pasek działa też, gdy zaznaczenie na chwilę zniknęło.
  saved: Offsets | null
  onChange: (value: string) => void
  multiline: boolean
  alignable: boolean
}

const FORMAT_MARKS: Record<string, number> = {
  formatBold: MARK.bold,
  formatItalic: MARK.italic,
  formatUnderline: MARK.underline,
  formatStrikeThrough: MARK.strike,
}
const KEY_MARKS: Record<string, number> = { b: MARK.bold, i: MARK.italic, u: MARK.underline }

const isEmpty = (value: string) => toPlain(value) === ''

function offsetsOf(el: HTMLElement, f: Field): Offsets {
  const end = toPlain(f.synced ?? '').length
  return getOffsets(el) ?? f.saved ?? { start: end, end }
}

/** Nowa wartość z operacji: rysuje DOM, ustawia zaznaczenie, zgłasza zmianę. */
function commit(el: HTMLElement, f: Field, next: string, start: number, end: number) {
  const changed = next !== f.synced
  f.synced = next
  if (changed) {
    renderDoc(el, next, { inline: f.inline })
    el.toggleAttribute('data-empty', isEmpty(next))
  }
  if (el.ownerDocument.activeElement === el) setOffsets(el, start, end)
  f.saved = { start, end }
  if (changed) f.onChange(next)
}

/** DOM → wartość po zwykłym pisaniu. `canonize`: przerysuj, gdy przeglądarka dołożyła obcy kształt. */
function syncFromDom(el: HTMLElement, f: Field, canonize: boolean) {
  let next = readDoc(el)
  let force = false
  const plain = toPlain(next)
  // Pole jednowierszowe: nowe linie, które przecisnęła przeglądarka, to spacje.
  if (!f.multiline && plain.includes('\n')) {
    next = applyPlainEdit(next, plain.replace(/\n+/g, ' '))
    force = true
  }
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

function applyFormat(el: HTMLElement, f: Field, op: FormatOp) {
  if (f.composing) return
  syncFromDom(el, f, false)
  const value = f.synced ?? ''
  const { start, end } = offsetsOf(el, f)
  let next = value
  if (op.kind === 'mark') next = toggleMark(value, start, end, op.mark)
  else if (op.kind === 'clear') next = clearMarks(value, start, end)
  else if (f.alignable) next = setAlign(value, start, end, op.align)
  commit(el, f, next, start, end)
}

function toolbarState(el: HTMLElement, f: Field): ToolbarState {
  const value = f.synced ?? ''
  const { start, end } = offsetsOf(el, f)
  return {
    marks: marksIn(value, start, end),
    align: f.alignable ? alignIn(value, start, end) : null,
    alignable: f.alignable,
  }
}

function insertText(el: HTMLElement, f: Field, text: string, at: Offsets) {
  const result = insertPlain(f.synced ?? '', at.start, at.end, text, f.multiline)
  commit(el, f, result.value, result.caret, result.caret)
}

function onBeforeInput(el: HTMLElement, f: Field, event: InputEvent) {
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
    || (type === 'insertText' && event.data !== null && /[\r\n-]/.test(event.data))
  if (!handled) return
  event.preventDefault()
  syncFromDom(el, f, false)
  const target = event.getTargetRanges?.()[0]
  const at = (target && rangeOffsets(el, target)) ?? offsetsOf(el, f)
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

/** Pole contentEditable edytujące tekst z formatowaniem (zapis z format.ts). */
export function RichEditable({
  value, onChange, as = 'div', style, multiline = false, alignable = false,
  placeholder, ariaLabel, marker, onKeyDownCapture,
}: RichEditableProps): ReactElement {
  const ref = useRef<HTMLElement>(null)
  const inline = !alignable
  const field = useRef<Field>({
    synced: null, inline, composing: false, saved: null, onChange, multiline, alignable,
  })

  // Pierwszy efekt: kolejne (i zdarzenia) widzą już bieżące propsy.
  useLayoutEffect(() => {
    Object.assign(field.current, { onChange, multiline, alignable })
  })

  // Treść niekontrolowana: React nie renderuje dzieci, bo każde jego
  // uzgodnienie przestawiałoby kursor. Layout effect - tekst jest na miejscu
  // przed pierwszym malowaniem.
  useLayoutEffect(() => {
    const el = ref.current
    const f = field.current
    if (!el || (value === f.synced && inline === f.inline)) return
    const focused = el.ownerDocument.activeElement === el
    const offsets = focused ? getOffsets(el) : null
    f.synced = value
    f.inline = inline
    renderDoc(el, value, { inline })
    el.toggleAttribute('data-empty', isEmpty(value))
    if (!focused) return
    if (offsets) setOffsets(el, offsets.start, offsets.end)
    else placeCaretAtEnd(el)
  }, [value, inline])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const f = field.current
    const doc = el.ownerDocument
    const beforeInput = (event: InputEvent) => onBeforeInput(el, f, event)
    const selectionChange = () => {
      const offsets = getOffsets(el)
      if (offsets) f.saved = offsets
    }
    // React nie daje natywnego `beforeinput` z `inputType`.
    el.addEventListener('beforeinput', beforeInput)
    doc.addEventListener('selectionchange', selectionChange)
    const unregister = registerRichField(el, {
      applyFormat: (op) => applyFormat(el, f, op),
      state: () => toolbarState(el, f),
    })
    return () => {
      el.removeEventListener('beforeinput', beforeInput)
      doc.removeEventListener('selectionchange', selectionChange)
      unregister()
    }
  }, [])

  const onInput = () => {
    if (ref.current) syncFromDom(ref.current, field.current, true)
  }

  const onBlur = () => {
    const el = ref.current
    const f = field.current
    if (!el) return
    f.composing = false
    syncFromDom(el, f, false)
    // Po edycji DOM może zawierać śmieci przeglądarki - wracamy do kształtu
    // identycznego z tym, co narysuje miniatura i eksport.
    renderDoc(el, f.synced ?? '', { inline: f.inline })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const key = event.key.toLowerCase()
    const mod = event.ctrlKey || event.metaKey
    // Cofnij/ponów i zapis należą do edytora - przepuszczamy je w górę.
    if (mod && (key === 'z' || key === 'y' || key === 's')) return
    // Reszta nie może wyzwolić skrótów edytora (Delete usuwa slajd, strzałki
    // przełączają slajdy) w trakcie pisania.
    event.stopPropagation()
    if (event.nativeEvent.isComposing) return
    if (mod && !event.altKey && KEY_MARKS[key]) {
      // Zapasowo dla przeglądarek bez `formatBold` w beforeinput.
      event.preventDefault()
      applyFormat(event.currentTarget, field.current, { kind: 'mark', mark: KEY_MARKS[key] })
    } else if (event.key === 'Escape') {
      event.currentTarget.blur()
    } else if (event.key === 'Enter' && !multiline) {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLElement>) => {
    // Zawsze czysty tekst: wklejony HTML nie wnosi formatowania ani obcych węzłów.
    event.preventDefault()
    const el = event.currentTarget
    const f = field.current
    syncFromDom(el, f, false)
    insertText(el, f, event.clipboardData.getData('text/plain'), offsetsOf(el, f))
  }

  const onCompositionEnd = () => {
    field.current.composing = false
    if (ref.current) syncFromDom(ref.current, field.current, true)
  }

  const Tag = as
  return (
    <Tag
      // Tag jest unią, więc TS widzi tu ref <div>; każdy z tagów to HTMLElement.
      ref={ref as Ref<HTMLDivElement>}
      style={{ whiteSpace: 'pre-line', ...style }}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline={multiline || undefined}
      {...{ [marker]: '' }}
      data-rich-field=""
      data-alignable={alignable ? '' : undefined}
      data-placeholder={placeholder}
      data-empty={isEmpty(value) ? '' : undefined}
      onInput={onInput}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onKeyDownCapture={onKeyDownCapture}
      onPaste={onPaste}
      onCompositionStart={() => { field.current.composing = true }}
      onCompositionEnd={onCompositionEnd}
      // Kliknięcie w tekst to edycja, nie zaznaczenie/przeciąganie slajdu.
      onPointerDown={(event) => event.stopPropagation()}
    />
  )
}
