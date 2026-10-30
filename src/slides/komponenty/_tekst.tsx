import { createElement, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useSlideEdit } from '../defineSlide'
import { RichEditable, RichText, toPlain } from '../../richText'
import type { EditableTag } from '../../richText'

// Tekst slajdu (EditableText) i dopasowanie fontu do pudełka (AutoFit).
// Sygnatury eksportów to kontrakt dla komponentów slajdów - wolno tylko
// dopisywać opcjonalne propsy.

// Rozmiar fontu, który zmniejsza AutoFit: `fontSize: fit(74)`.
export function fit(px: number): string {
  return `calc(${px}px * var(--fit, 1))`
}

export type { EditableTag }

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
  // Czy pole obsługuje wyrównanie wierszy (domyślnie jak `multiline`).
  alignable?: boolean
}

// Tekst slajdu, który w edytorze można kliknąć i zmienić.
export function EditableText(props: EditableTextProps) {
  const { editable } = useSlideEdit()
  // Dwa osobne komponenty: przełączenie trybu montuje element od nowa, więc
  // React nigdy nie dostaje węzła, którego tekst ustawialiśmy ręcznie.
  return editable ? <EditableField {...props} /> : <StaticText {...props} />
}

function StaticText({ value, as = 'div', style, multiline, alignable }: EditableTextProps) {
  // Pusty tekst (także same znaczniki formatu): element zostaje (odstępy
  // flexa, siatka), tylko bez treści.
  return createElement(
    as,
    { style: { whiteSpace: 'pre-line', ...style } },
    toPlain(value) ? <RichText value={value} inline={!(alignable ?? multiline)} /> : undefined,
  )
}

function EditableField({ path, value, as = 'div', style, multiline = false, alignable, placeholder }: EditableTextProps) {
  const { onText } = useSlideEdit()
  return (
    <RichEditable
      value={value}
      onChange={(v) => onText(path, v)}
      as={as}
      // Slajdy: pre-line także w polach jednowierszowych - jak StaticText.
      style={{ whiteSpace: 'pre-line', ...style }}
      multiline={multiline}
      alignable={alignable ?? multiline}
      placeholder={placeholder}
      ariaLabel={placeholder ?? path}
      marker="data-slide-edit"
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

// Czy treść wychodzi poza pudełko. Nie `scrollHeight`: nagłówki mają
// interlinię ~1,04, ciaśniejszą niż obszar treści fontu, więc przeglądarka
// zawsze liczy kilka px „przewijania", nawet gdy nic nie jest ucięte - i każdy
// nagłówek spadał do minimum z ostrzeżeniem. Bierzemy więc pudełka układu
// dzieci (offset*, bez transformacji kroków „pokazuj po kolei"); pudełko AutoFit
// ma `position: relative`, więc to ono jest ich offsetParent.
function contentOverflows(el: HTMLElement): boolean {
  let bottom = 0
  let right = 0
  for (const child of Array.from(el.children)) {
    if (!(child instanceof HTMLElement)) continue
    const margin = parseFloat(getComputedStyle(child).marginBottom) || 0
    bottom = Math.max(bottom, child.offsetTop + child.offsetHeight + margin)
    right = Math.max(right, child.offsetLeft + child.offsetWidth)
  }
  // Tekst wpisany wprost w pudełko (bez elementu) - zostaje stara miara.
  const looseText = Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
  if (looseText) return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
  return bottom > el.clientHeight + 1 || right > el.clientWidth + 1
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
      return contentOverflows(el)
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
    <div ref={ref} style={{ position: 'relative', minHeight: 0, ...style, ['--fit' as string]: 1 }}>
      {children}
    </div>
  )
}
