import { createElement, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { ClipboardEvent, CSSProperties, KeyboardEvent, ReactNode, Ref } from 'react'
import { useSlideEdit } from '../defineSlide'

// Tekst slajdu (EditableText) i dopasowanie fontu do pudełka (AutoFit).
// Sygnatury eksportów to kontrakt dla komponentów slajdów - wolno tylko
// dopisywać opcjonalne propsy.

// Rozmiar fontu, który zmniejsza AutoFit: `fontSize: fit(74)`.
export function fit(px: number): string {
  return `calc(${px}px * var(--fit, 1))`
}

export type EditableTag = 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'b' | 'i' | 'figcaption'

export interface EditableTextProps {
  // Ścieżka w `data` slajdu, np. `heading` albo `cards.2.title`.
  path: string
  value: string
  as?: EditableTag
  style?: CSSProperties
  // Enter = nowa linia (akapity). Bez tego Enter kończy edycję.
  multiline?: boolean
  // Podpowiedź w edytorze, gdy pole jest puste (poza edytorem pusty tekst nie rysuje nic).
  placeholder?: string
}

// `plaintext-only` nie wpuszcza do pola formatowania (wklejony HTML, Ctrl+B),
// ale starsze Firefoksy go nie znają - wtedy zwykłe `true` i własna obsługa
// wklejania. Sprawdzane raz; na serwerze (SSR, testy) zakładamy wsparcie.
let plaintextOnly: boolean | undefined
function supportsPlaintextOnly(): boolean {
  if (typeof document === 'undefined') return true
  if (plaintextOnly === undefined) {
    try {
      const probe = document.createElement('div')
      probe.contentEditable = 'plaintext-only'
      plaintextOnly = probe.contentEditable === 'plaintext-only'
    } catch {
      plaintextOnly = false
    }
  }
  return plaintextOnly
}

// Tekst z DOM pola do zapisu w `data`. Przeglądarki dokładają na końcu pusty
// wiersz (placeholder `<br>`) i wstawiają twarde spacje przy spacjach na końcu.
export function normalizeEditedText(raw: string, multiline: boolean): string {
  const text = raw.replace(/ /g, ' ').replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  // Pole jednowierszowe: wklejone wiersze sklejamy spacją, a nie „na styk".
  return multiline ? text : text.replace(/\n+/g, ' ')
}

function placeCaretAtEnd(el: HTMLElement) {
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

// Tekst slajdu, który w edytorze można kliknąć i zmienić.
export function EditableText(props: EditableTextProps) {
  const { editable } = useSlideEdit()
  // Dwa osobne komponenty: przełączenie trybu montuje element od nowa, więc
  // React nigdy nie dostaje węzła, którego tekst ustawialiśmy ręcznie.
  return editable ? <EditableField {...props} /> : <StaticText {...props} />
}

function StaticText({ value, as = 'div', style }: EditableTextProps) {
  // Pusty tekst: element zostaje (odstępy flexa, siatka), tylko bez treści.
  return createElement(as, { style: { whiteSpace: 'pre-line', ...style } }, value || undefined)
}

function EditableField({ path, value, as = 'div', style, multiline = false, placeholder }: EditableTextProps) {
  const { onText } = useSlideEdit()
  const ref = useRef<HTMLElement>(null)
  // Ostatni tekst, który to pole wysłało (albo dostało i wpisało do DOM).
  // `value` różne od niego = zmiana z zewnątrz (cofnij, panel) - wtedy
  // nadpisujemy DOM nawet w trakcie pisania.
  const lastSynced = useRef<string | null>(null)

  // Treść pola jest niekontrolowana: React nie renderuje dzieci, bo każde
  // jego uzgodnienie przestawiałoby kursor. Layout effect - tekst jest na
  // miejscu przed pierwszym malowaniem.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || value === lastSynced.current) return
    lastSynced.current = value
    if (el.textContent === value) return
    el.textContent = value
    el.toggleAttribute('data-empty', value === '')
    if (document.activeElement === el) placeCaretAtEnd(el)
  }, [value])

  const onInput = () => {
    const el = ref.current
    if (!el) return
    const text = normalizeEditedText(el.innerText, multiline)
    // Placeholder (::before) znika od razu, bez czekania na render rodzica.
    el.toggleAttribute('data-empty', text === '')
    if (text === lastSynced.current) return
    lastSynced.current = text
    onText(path, text)
  }

  const onBlur = () => {
    const el = ref.current
    // Po edycji DOM może zawierać `<br>`/`<div>` przeglądarki - wracamy do
    // czystego tekstu, identycznego z tym, co narysuje miniatura i eksport.
    if (el && lastSynced.current !== null && el.textContent !== lastSynced.current) {
      el.textContent = lastSynced.current
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const key = event.key.toLowerCase()
    // Cofnij/ponów i zapis należą do edytora - przepuszczamy je w górę.
    if ((event.ctrlKey || event.metaKey) && (key === 'z' || key === 'y' || key === 's')) return
    // Reszta nie może wyzwolić skrótów edytora (Delete usuwa slajd, strzałki
    // przełączają slajdy) w trakcie pisania.
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.currentTarget.blur()
    } else if (event.key === 'Enter' && !multiline && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const fallback = !supportsPlaintextOnly()

  const onPaste = (event: ClipboardEvent<HTMLElement>) => {
    // `plaintext-only` sam wkleja czysty tekst; poprawiamy tylko pole
    // jednowierszowe (bez nowych linii) i tryb zapasowy (bez HTML).
    if (!fallback && multiline) return
    event.preventDefault()
    let text = event.clipboardData.getData('text/plain')
    if (!multiline) text = text.replace(/\s*[\r\n]+\s*/g, ' ')
    // execCommand jest przestarzały, ale tylko on wstawia tekst w miejscu
    // kursora z zachowaniem natywnej historii pola i zdarzenia `input`.
    document.execCommand('insertText', false, text)
  }

  const Tag = as
  return (
    <Tag
      // Tag jest unią, więc TS widzi tu ref <div>; każdy z tagów to HTMLElement.
      ref={ref as Ref<HTMLDivElement>}
      style={{ whiteSpace: 'pre-line', ...style }}
      contentEditable={fallback ? true : 'plaintext-only'}
      suppressContentEditableWarning
      spellCheck
      role="textbox"
      aria-label={placeholder ?? path}
      aria-multiline={multiline || undefined}
      data-slide-edit=""
      data-placeholder={placeholder}
      data-empty={value === '' ? '' : undefined}
      onInput={onInput}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      // Kliknięcie w tekst to edycja, nie zaznaczenie/przeciąganie slajdu.
      onPointerDown={(event) => event.stopPropagation()}
    />
  )
}

// Największy mnożnik z [min, 1], przy którym treść się mieści (wyszukiwanie
// binarne, zakłada monotoniczność: mniejszy font nigdy nie przepełnia
// bardziej). `overflowing` = nie mieści się nawet przy `min`.
export function findFitFactor(
  overflowsAt: (factor: number) => boolean,
  min = 0.7,
  iterations = 7,
): { factor: number; overflowing: boolean } {
  const floor = Math.min(Math.max(min, 0.01), 1)
  if (!overflowsAt(1)) return { factor: 1, overflowing: false }
  if (overflowsAt(floor)) return { factor: floor, overflowing: true }
  // `fits` zawsze się mieści, `over` zawsze przepełnia.
  let fits = floor
  let over = 1
  for (let i = 0; i < iterations; i++) {
    const mid = (fits + over) / 2
    if (overflowsAt(mid)) over = mid
    else fits = mid
  }
  // W dół, nie do najbliższej - zaokrąglenie w górę mogłoby znów przepełnić.
  return { factor: Math.max(floor, Math.floor(fits * 1000) / 1000), overflowing: false }
}

export interface AutoFitProps {
  // Unikalny w obrębie slajdu - pod nim AutoFit zgłasza przepełnienie.
  id: string
  children: ReactNode
  // Pudełko, w którym tekst ma się zmieścić (musi mieć ograniczoną wysokość,
  // np. `flex: 1, minHeight: 0` albo stałe `height`).
  style?: CSSProperties
  // Najmniejszy mnożnik fontu (domyślnie 0,7).
  min?: number
}

// Zmniejsza fonty potomków (te podane przez `fit(px)`), aż treść zmieści się w pudełku.
export function AutoFit({ id, children, style, min = 0.7 }: AutoFitProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { onOverflow } = useSlideEdit()
  const latest = useRef({ id, min, onOverflow })
  const state = useRef({ factor: 1, overflowing: false, size: '' })

  // Mnożnik trafia prosto do `style` elementu, nie do stanu Reacta: bez
  // dodatkowego renderu (i pętli), a eksport HTML serializujący żywy DOM
  // oraz html-to-image widzą go w atrybucie `style`.
  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { id, min, onOverflow } = latest.current
    const result = findFitFactor((factor) => {
      el.style.setProperty('--fit', String(factor))
      return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
    }, min)
    el.style.setProperty('--fit', String(result.factor))
    state.current.factor = result.factor
    state.current.size = `${el.clientWidth}x${el.clientHeight}`
    if (result.overflowing !== state.current.overflowing) {
      state.current.overflowing = result.overflowing
      onOverflow(id, result.overflowing)
    }
  }, [])

  // Po każdym renderze (zmiana danych, motywu, proporcji) - przed malowaniem,
  // więc nie widać mignięcia pełnego rozmiaru.
  useLayoutEffect(() => {
    latest.current = { id, min, onOverflow }
    measure()
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Nowe `id` (albo pierwsze zamontowanie): stan zgłoszenia jest wyzerowany
    // przez sprzątanie poprzedniego, więc zgłaszamy od nowa pod nowym id.
    measure()
    // Pisanie w EditableText zmienia DOM bez renderu Reacta.
    const mutations = new MutationObserver(() => measure())
    mutations.observe(el, { characterData: true, childList: true, subtree: true })
    // Zmiana mnożnika zmienia wysokość pudełka (np. przy `maxHeight`) i budzi
    // ResizeObserver - mierzymy znowu tylko, gdy rozmiar różni się od tego,
    // który zostawił ostatni pomiar.
    const resize = new ResizeObserver(() => {
      if (`${el.clientWidth}x${el.clientHeight}` !== state.current.size) measure()
    })
    resize.observe(el)
    // Pierwszy pomiar mógł trafić na font zapasowy o innej szerokości.
    let alive = true
    document.fonts?.ready.then(() => {
      if (alive) measure()
    })
    const current = state.current
    return () => {
      alive = false
      mutations.disconnect()
      resize.disconnect()
      current.overflowing = false
      latest.current.onOverflow(id, false)
    }
  }, [id, measure])

  // `--fit: 1` w propsie tylko jako wartość startowa - React nie nadpisze
  // ustawionej ręcznie wartości, dopóki ten prop się nie zmieni.
  return (
    <div ref={ref} style={{ minHeight: 0, ...style, ['--fit' as string]: 1 }}>
      {children}
    </div>
  )
}
