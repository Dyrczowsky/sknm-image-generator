import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ClipboardEvent, CSSProperties, KeyboardEvent, ReactElement, Ref } from 'react'
import { isMacPlatform } from '../shortcuts/shortcuts'
import { getOffsets, renderDoc } from './dom'
import {
  applyExternal, applyFormat, createField, endComposition, insertText, isEmpty, onBeforeInput, shortcutMark,
  syncFromDom, toolbarState,
} from './field'
import { registerRichField } from './fieldRegistry'
import type { ChangeMeta } from './fieldRegistry'

export type EditableTag = 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'b' | 'i' | 'figcaption'

export interface RichEditableProps {
  value: string
  // `meta` przy zmianie z formatowania (pasek, skrót) - patrz ChangeMeta.
  onChange: (value: string, meta?: ChangeMeta) => void
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

/** Pole contentEditable edytujące tekst z formatowaniem (zapis z format.ts). */
export function RichEditable({
  value, onChange, as = 'div', style, multiline = false, alignable = false,
  placeholder, ariaLabel, marker, onKeyDownCapture,
}: RichEditableProps): ReactElement {
  const ref = useRef<HTMLElement>(null)
  const inline = !alignable
  const field = useRef(createField({ onChange, multiline, alignable }))

  // Pierwszy efekt: kolejne (i zdarzenia) widzą już bieżące propsy.
  useLayoutEffect(() => {
    Object.assign(field.current, { onChange, multiline, alignable })
  })

  // Treść niekontrolowana: React nie renderuje dzieci, bo każde jego
  // uzgodnienie przestawiałoby kursor. Layout effect - tekst jest na miejscu
  // przed pierwszym malowaniem. `as` w zależnościach: nowy tag to nowy element.
  useLayoutEffect(() => {
    if (ref.current) applyExternal(ref.current, field.current, value, inline)
  }, [value, inline, as])

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
  }, [as])

  const onInput = () => {
    if (ref.current) syncFromDom(ref.current, field.current, true)
  }

  const onBlur = () => {
    const el = ref.current
    const f = field.current
    if (!el) return
    if (f.composing) endComposition(el, f)
    syncFromDom(el, f, false)
    // Po edycji DOM może zawierać śmieci przeglądarki - wracamy do kształtu
    // identycznego z tym, co narysuje miniatura i eksport.
    renderDoc(el, f.synced ?? '', { inline: f.inline })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const key = event.key.toLowerCase()
    // Cofnij/ponów i zapis należą do edytora - przepuszczamy je w górę.
    if ((event.ctrlKey || event.metaKey) && (key === 'z' || key === 'y' || key === 's')) return
    // Reszta nie może wyzwolić skrótów edytora (Delete usuwa slajd, strzałki
    // przełączają slajdy) w trakcie pisania.
    event.stopPropagation()
    if (event.nativeEvent.isComposing) return
    const mark = shortcutMark(event, isMacPlatform())
    if (mark !== null) {
      // Zapasowo dla przeglądarek bez `formatBold` w beforeinput.
      event.preventDefault()
      applyFormat(event.currentTarget, field.current, { kind: 'mark', mark })
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
    insertText(event.currentTarget, field.current, event.clipboardData.getData('text/plain'))
  }

  const Tag = as
  return (
    <Tag
      // Tag jest unią, więc TS widzi tu ref <div>; każdy z tagów to HTMLElement.
      ref={ref as Ref<HTMLDivElement>}
      // Wielowierszowe: wiersze widoczne (pre-line). Jednowierszowe dziedziczą
      // white-space szablonu (np. `nowrap` w InfoLine) - jak w wersji statycznej.
      style={multiline ? { whiteSpace: 'pre-line', ...style } : style}
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
      onCompositionEnd={() => { if (ref.current) endComposition(ref.current, field.current) }}
      // Kliknięcie w tekst to edycja, nie zaznaczenie/przeciąganie slajdu.
      onPointerDown={(event) => event.stopPropagation()}
    />
  )
}
