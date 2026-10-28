import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addSlide as addSlideTo,
  createSlide,
  duplicateSlide as duplicateSlideIn,
  moveSlide as moveSlideIn,
  removeSlide as removeSlideFrom,
  setDataPath,
  setDeckProps as setDeckPropsOf,
  updateSlide as updateSlideIn,
} from './deck'
import { canRedo, canUndo, initHistory, pushHistory, redo as redoHistory, replacePresent, undo as undoHistory } from './history'
import type { History } from './history'
import { layoutOf } from './komponenty'
import type { Deck, Slide, SlideAspect, SlideData, SlideValue } from './types'

// Stan edytora prezentacji: historia talii i zaznaczony slajd. Logika to
// czyste funkcje (testowane w editor.test.ts); hook tylko trzyma stan,
// zapisuje każdą nową wersję i składa akcje.

export interface EditorState {
  history: History<Deck>
  selected: number
}

type DeckPatch = Parameters<typeof setDeckPropsOf>[1]
type SlidePatch = Parameters<typeof updateSlideIn>[2]

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.min(Math.max(index, 0), length - 1)
}

export function initEditor(deck: Deck, selected = 0): EditorState {
  return { history: initHistory(deck), selected: clampIndex(selected, deck.slides.length) }
}

// Nowa wersja talii jako krok historii; zaznaczenie zawsze w zakresie.
function commit(state: EditorState, next: Deck, selected = state.selected, key?: string, now?: number): EditorState {
  const history = pushHistory(state.history, next, { key, now })
  return { history, selected: clampIndex(selected, next.slides.length) }
}

export function selectSlide(state: EditorState, index: number): EditorState {
  const selected = clampIndex(index, state.history.present.slides.length)
  return selected === state.selected ? state : { ...state, selected }
}

// Nowy slajd ląduje za zaznaczonym i od razu staje się zaznaczony.
export function addSlideAfter(state: EditorState, slide: Slide): EditorState {
  const deck = state.history.present
  const at = deck.slides.length === 0 ? -1 : state.selected
  return commit(state, addSlideTo(deck, slide, at), at + 1)
}

export function duplicateAt(state: EditorState, index: number): EditorState {
  const deck = state.history.present
  if (!deck.slides[index]) return state
  return commit(state, duplicateSlideIn(deck, index), index + 1)
}

// Ostatniego slajdu nie usuwamy - pusta talia nie ma czego pokazać ani edytować.
export function removeAt(state: EditorState, index: number): EditorState {
  const deck = state.history.present
  if (deck.slides.length <= 1 || !deck.slides[index]) return state
  // Zaznaczenie zostaje na tym samym miejscu (następny slajd), a za końcem - na poprzednim.
  const selected = index < state.selected ? state.selected - 1 : state.selected
  return commit(state, removeSlideFrom(deck, index), selected)
}

// Zaznaczenie idzie za zaznaczonym slajdem, gdziekolwiek trafi.
export function moveTo(state: EditorState, from: number, to: number): EditorState {
  const deck = state.history.present
  const next = moveSlideIn(deck, from, to)
  if (next === deck) return state
  const selectedId = deck.slides[state.selected]?.id
  const selected = next.slides.findIndex((slide) => slide.id === selectedId)
  return commit(state, next, selected === -1 ? state.selected : selected)
}

// Pisanie na slajdzie: kolejne litery w tym samym polu sklejają się w jedno cofnięcie.
export function textKey(slideId: string, path: string): string {
  return `text:${slideId}:${path}`
}

export function setTextAt(state: EditorState, index: number, path: string, value: string, now?: number): EditorState {
  const deck = state.history.present
  const slide = deck.slides[index]
  if (!slide) return state
  const next = setDataPath(deck, index, path, value)
  if (next === deck) return state
  return commit(state, next, state.selected, textKey(slide.id, path), now)
}

export function updateSlideAt(state: EditorState, index: number, patch: SlidePatch, key?: string, now?: number): EditorState {
  const deck = state.history.present
  if (!deck.slides[index]) return state
  return commit(state, updateSlideIn(deck, index, patch), state.selected, key, now)
}

export function setDeckPropsIn(state: EditorState, patch: DeckPatch, key?: string, now?: number): EditorState {
  return commit(state, setDeckPropsOf(state.history.present, patch), state.selected, key, now)
}

// Format podglądu to tylko wygoda widoku - zapisujemy go, ale bez kroku cofania.
export function setViewAspectIn(state: EditorState, viewAspect: SlideAspect): EditorState {
  const deck = state.history.present
  if (deck.viewAspect === viewAspect) return state
  return { ...state, history: replacePresent(state.history, { ...deck, viewAspect }) }
}

// Po cofnięciu zaznaczenie zostaje przy tym samym slajdzie, jeśli nadal istnieje.
function travel(state: EditorState, next: History<Deck>): EditorState {
  if (next === state.history) return state
  // Format podglądu nie jest krokiem historii - cofnięcie treści nie może go
  // przełączyć z powrotem (wpisy w past/future mają stary format).
  const viewAspect = state.history.present.viewAspect
  const history = next.present.viewAspect === viewAspect ? next : replacePresent(next, { ...next.present, viewAspect })
  const selectedId = state.history.present.slides[state.selected]?.id
  const found = history.present.slides.findIndex((slide) => slide.id === selectedId)
  return { history, selected: clampIndex(found === -1 ? state.selected : found, history.present.slides.length) }
}

export function undoIn(state: EditorState): EditorState {
  return travel(state, undoHistory(state.history))
}

export function redoIn(state: EditorState): EditorState {
  return travel(state, redoHistory(state.history))
}

// --- Zmiana układu ---

function kindOf(value: SlideValue): 'string' | 'boolean' | 'list' | 'photo' {
  if (typeof value === 'string') return 'string'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'list'
  return 'photo'
}

const sameKeys = (a: Record<string, string>, b: Record<string, string>) => {
  const left = Object.keys(a).sort().join('|')
  return left === Object.keys(b).sort().join('|')
}

// Czy wartość starego układu pasuje do pola nowego: ten sam rodzaj, a lista -
// pozycje o tych samych polach (karty {title, text} to nie tagi {text}).
function compatible(value: SlideValue, def: SlideValue): boolean {
  if (kindOf(value) !== kindOf(def)) return false
  if (!Array.isArray(value) || !Array.isArray(def)) return true
  const sample = def[0]
  return !sample || value.every((item) => sameKeys(item, sample))
}

// Dane slajdu po zmianie układu: klucze, które nowy układ zna z tym samym
// typem, przechodzą; reszta - z wartości domyślnych nowego układu.
export function migrateData(data: SlideData, layoutKey: string): SlideData {
  const layout = layoutOf(layoutKey)
  if (!layout) return data
  const next: SlideData = {}
  for (const [key, def] of Object.entries(layout.defaults)) {
    const value = data[key]
    let kept: SlideValue = value !== undefined && compatible(value, def) ? value : def
    // Lista musi zmieścić się w granicach nowego układu.
    if (Array.isArray(kept)) {
      const spec = layout.fields.find((field) => field.kind === 'list' && field.key === key)
      const max = spec?.kind === 'list' ? spec.max : undefined
      const min = spec?.kind === 'list' ? (spec.min ?? 0) : 0
      if (max !== undefined && kept.length > max) kept = kept.slice(0, max)
      if (kept.length < min) kept = def
    }
    next[key] = structuredClone(kept)
  }
  return next
}

export function changeLayoutAt(state: EditorState, index: number, layoutKey: string): EditorState {
  const deck = state.history.present
  const slide = deck.slides[index]
  const layout = layoutOf(layoutKey)
  if (!slide || !layout || slide.layout === layoutKey) return state
  const data = migrateData(slide.data, layoutKey)
  // „Pokazuj po kolei" ma sens tylko, gdy nowy układ ma kroki.
  const reveal = slide.reveal && stepCount(layoutKey, data) > 0
  return commit(state, updateSlideIn(deck, index, { layout: layoutKey, data, reveal }), state.selected)
}

export function stepCount(layoutKey: string, data: SlideData): number {
  const layout = layoutOf(layoutKey)
  if (!layout?.steps) return 0
  return layout.steps({ ...layout.defaults, ...data })
}

// --- Przeciąganie w pasku miniatur ---

// Miejsce upuszczenia z pozycji wskaźnika: przed którym slajdem (0..n) ma
// stanąć przeciągany. `centers` - środki miniatur w osi paska.
export function dropSlot(pointer: number, centers: readonly number[]): number {
  const slot = centers.findIndex((center) => pointer < center)
  return slot === -1 ? centers.length : slot
}

// Szczelina (przed slajdem `slot`) → docelowy indeks dla `moveSlide`.
export function slotToIndex(from: number, slot: number): number {
  return slot > from ? slot - 1 : slot
}

// --- Przepełnienie tekstu ---

// slideId → identyfikatory pudełek AutoFit, które się nie mieszczą. Źródło
// (miniatura / płótno) jest w identyfikatorze, bo każde zgłasza osobno i przy
// odmontowaniu odwołuje tylko swoje.
export type OverflowMap = Readonly<Record<string, ReadonlySet<string>>>

export function reportOverflow(map: OverflowMap, slideId: string, id: string, overflowing: boolean): OverflowMap {
  const current = map[slideId]
  if (overflowing === Boolean(current?.has(id))) return map
  const next = new Set(current)
  if (overflowing) next.add(id)
  else next.delete(id)
  const copy: Record<string, ReadonlySet<string>> = { ...map }
  if (next.size === 0) delete copy[slideId]
  else copy[slideId] = next
  return copy
}

// --- Hook ---

export interface DeckEditor {
  deck: Deck
  selected: number
  slide: Slide | undefined
  viewAspect: SlideAspect
  overflow: OverflowMap
  canUndo: boolean
  canRedo: boolean
  select(index: number): void
  addSlide(layoutKey: string): void
  duplicate(index?: number): void
  remove(index?: number): void
  move(from: number, to: number): void
  setText(path: string, value: string): void
  updateSlide(patch: SlidePatch, index?: number): void
  // Pole danych zaznaczonego slajdu (panel właściwości). `key` skleja kroki historii.
  setData(key: string, value: SlideValue, historyKey?: string): void
  changeLayout(layoutKey: string): void
  setDeckProps(patch: DeckPatch, key?: string): void
  setViewAspect(aspect: SlideAspect): void
  // Przejście dla wszystkich slajdów: domyślne talii + usunięcie nadpisań.
  applyTransitionToAll(): void
  undo(): void
  redo(): void
  onOverflow(slideId: string, id: string, overflowing: boolean): void
}

export function useDeckEditor(initial: Deck, save: (deck: Deck) => void): DeckEditor {
  const [state, setState] = useState(() => initEditor(initial))
  const [overflow, setOverflow] = useState<OverflowMap>({})
  const deck = state.history.present

  // Każda nowa wersja idzie do zapisu (useDecks sam ją opóźnia); pierwszej -
  // właśnie wczytanej - nie zapisujemy.
  const saved = useRef(initial)
  useEffect(() => {
    if (saved.current === deck) return
    saved.current = deck
    save(deck)
  }, [deck, save])

  const update = useCallback((fn: (s: EditorState) => EditorState) => setState(fn), [])

  const actions = useMemo(
    () => ({
      select: (index: number) => update((s) => selectSlide(s, index)),
      addSlide: (layoutKey: string) => update((s) => addSlideAfter(s, createSlide(layoutKey))),
      duplicate: (index?: number) => update((s) => duplicateAt(s, index ?? s.selected)),
      remove: (index?: number) => update((s) => removeAt(s, index ?? s.selected)),
      move: (from: number, to: number) => update((s) => moveTo(s, from, to)),
      setText: (path: string, value: string) => update((s) => setTextAt(s, s.selected, path, value)),
      updateSlide: (patch: SlidePatch, index?: number) => update((s) => updateSlideAt(s, index ?? s.selected, patch)),
      setData: (key: string, value: SlideValue, historyKey?: string) =>
        update((s) => {
          const slide = s.history.present.slides[s.selected]
          if (!slide || !(key in slide.data)) return s
          return updateSlideAt(s, s.selected, { data: { ...slide.data, [key]: value } }, historyKey ? `data:${slide.id}:${historyKey}` : undefined)
        }),
      changeLayout: (layoutKey: string) => update((s) => changeLayoutAt(s, s.selected, layoutKey)),
      setDeckProps: (patch: DeckPatch, key?: string) => update((s) => setDeckPropsIn(s, patch, key)),
      setViewAspect: (aspect: SlideAspect) => update((s) => setViewAspectIn(s, aspect)),
      applyTransitionToAll: () =>
        update((s) => {
          const current = s.history.present
          const chosen = current.slides[s.selected]?.transition ?? current.transition
          const slides = current.slides.map((slide) => {
            if (slide.transition === undefined) return slide
            const copy = { ...slide }
            delete copy.transition
            return copy
          })
          return commit(s, { ...current, transition: chosen, slides })
        }),
      undo: () => update(undoIn),
      redo: () => update(redoIn),
      onOverflow: (slideId: string, id: string, overflowing: boolean) => setOverflow((map) => reportOverflow(map, slideId, id, overflowing)),
    }),
    [update],
  )

  return {
    deck,
    selected: state.selected,
    slide: deck.slides[state.selected],
    viewAspect: deck.viewAspect,
    overflow,
    canUndo: canUndo(state.history),
    canRedo: canRedo(state.history),
    ...actions,
  }
}

// --- Skróty strony edytora ---

export type DeckShortcut =
  | 'undo'
  | 'redo'
  | 'save'
  | 'duplicate'
  | 'remove'
  | 'newSlide'
  | 'showFromStart'
  | 'showFromCurrent'
  | 'prevSlide'
  | 'nextSlide'

type KeyInput = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>

// Klawisz → akcja edytora (bez kontekstu fokusu - ten sprawdza DeckEditor).
// Na Macu modyfikatorem jest ⌘, gdzie indziej Ctrl.
export function deckShortcutFor(event: KeyInput, isMac: boolean): DeckShortcut | null {
  const mod = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  if (event.altKey) return null
  if (mod) {
    if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
    if (event.shiftKey) return null
    if (key === 'y') return 'redo'
    if (key === 's') return 'save'
    if (key === 'd') return 'duplicate'
    if (key === 'm') return 'newSlide'
    if (key === 'Enter') return 'showFromStart'
    return null
  }
  if (event.ctrlKey || event.metaKey) return null
  if (key === 'F5') return event.shiftKey ? 'showFromCurrent' : 'showFromStart'
  if (event.shiftKey) return null
  if (key === 'Delete' || key === 'Backspace') return 'remove'
  if (key === 'PageUp') return 'prevSlide'
  if (key === 'PageDown') return 'nextSlide'
  return null
}
