import { describe, expect, it } from 'vitest'
import { createDeck, createSlide } from '../../slides/deck'
import { canUndo } from '../../slides/history'
import { layoutOf } from '../../slides/komponenty'
import type { Deck, SlideItem } from '../../slides/types'
import {
  addSlideAfter,
  changeLayoutAt,
  deckShortcutFor,
  dropSlot,
  duplicateAt,
  initEditor,
  migrateData,
  moveTo,
  redoIn,
  removeAt,
  reportOverflow,
  selectSlide,
  setTextAt,
  setViewAspectIn,
  slotToIndex,
  undoIn,
} from '../../slides/useDeckEditor'
import type { EditorState } from '../../slides/useDeckEditor'
import { h, render } from '../ui/testUtils'
import { DeckList } from './DeckList'
import { Inspector } from './Inspector'

const noop = () => {}

function deckOf(...layouts: string[]): Deck {
  return createDeck('Test', layouts.map(createSlide))
}

const ids = (state: EditorState) => state.history.present.slides.map((slide) => slide.id)
const selectedId = (state: EditorState) => state.history.present.slides[state.selected]?.id

describe('useDeckEditor - czyste akcje', () => {
  it('nowy slajd ląduje za zaznaczonym i staje się zaznaczony', () => {
    const state = selectSlide(initEditor(deckOf('tytul', 'lista', 'cytat')), 1)
    const slide = createSlide('karty')
    const next = addSlideAfter(state, slide)
    expect(next.history.present.slides).toHaveLength(4)
    expect(next.selected).toBe(2)
    expect(selectedId(next)).toBe(slide.id)
    expect(canUndo(next.history)).toBe(true)
  })

  it('duplikat ląduje za oryginałem i jest zaznaczony', () => {
    const state = initEditor(deckOf('tytul', 'lista'))
    const next = duplicateAt(state, 0)
    expect(next.selected).toBe(1)
    expect(next.history.present.slides[1].layout).toBe('tytul')
    expect(next.history.present.slides[1].id).not.toBe(state.history.present.slides[0].id)
  })

  it('usunięcie zostawia poprawne zaznaczenie', () => {
    const base = deckOf('tytul', 'lista', 'cytat')
    // Usunięcie ostatniego (zaznaczonego) - zaznaczenie cofa się na poprzedni.
    const last = removeAt(selectSlide(initEditor(base), 2), 2)
    expect(last.selected).toBe(1)
    // Usunięcie slajdu przed zaznaczonym - zaznaczenie zostaje przy tym samym slajdzie.
    const before = selectSlide(initEditor(base), 2)
    const afterRemove = removeAt(before, 0)
    expect(selectedId(afterRemove)).toBe(selectedId(before))
    // Usunięcie zaznaczonego ze środka - zaznaczony staje się następny.
    const middle = removeAt(selectSlide(initEditor(base), 1), 1)
    expect(selectedId(middle)).toBe(base.slides[2].id)
  })

  it('ostatniego slajdu nie da się usunąć', () => {
    const state = initEditor(deckOf('tytul'))
    expect(removeAt(state, 0)).toBe(state)
  })

  it('przeniesienie: zaznaczenie idzie za zaznaczonym slajdem', () => {
    const base = deckOf('tytul', 'lista', 'cytat', 'karty')
    const moved = moveTo(selectSlide(initEditor(base), 0), 0, 2)
    expect(moved.selected).toBe(2)
    expect(selectedId(moved)).toBe(base.slides[0].id)
    // Przeniesienie innego slajdu przez zaznaczony przesuwa zaznaczenie o jeden.
    const other = moveTo(selectSlide(initEditor(base), 1), 0, 3)
    expect(selectedId(other)).toBe(base.slides[1].id)
    expect(other.selected).toBe(0)
  })

  it('pisanie w jednym polu daje jeden krok cofania', () => {
    let state = initEditor(deckOf('tytul'))
    const t0 = 10_000
    for (const [i, text] of ['A', 'Al', 'Ala'].entries()) state = setTextAt(state, 0, 'title', text, t0 + i * 200)
    expect(state.history.present.slides[0].data.title).toBe('Ala')
    expect(state.history.past).toHaveLength(1)
    const undone = undoIn(state)
    expect(undone.history.present.slides[0].data.title).toBe(createSlide('tytul').data.title)
    expect(canUndo(undone.history)).toBe(false)
    expect(redoIn(undone).history.present.slides[0].data.title).toBe('Ala')
  })

  it('pisanie w innym polu to osobny krok', () => {
    let state = initEditor(deckOf('tytul'))
    state = setTextAt(state, 0, 'title', 'X', 1000)
    state = setTextAt(state, 0, 'subtitle', 'Y', 1100)
    expect(state.history.past).toHaveLength(2)
  })

  it('cofnięcie po usunięciu wraca z poprawnym zaznaczeniem', () => {
    const state = removeAt(selectSlide(initEditor(deckOf('tytul', 'lista')), 1), 1)
    const undone = undoIn(state)
    expect(ids(undone)).toHaveLength(2)
    expect(undone.selected).toBeLessThan(2)
  })

  it('format podglądu nie tworzy kroku cofania', () => {
    const state = setViewAspectIn(initEditor(deckOf('tytul')), '1:1')
    expect(state.history.present.viewAspect).toBe('1:1')
    expect(canUndo(state.history)).toBe(false)
  })

  it('zmiana układu zachowuje zgodne klucze, resztę bierze z wartości domyślnych', () => {
    const state = initEditor(deckOf('karty'))
    const edited = setTextAt(state, 0, 'heading', 'Mój nagłówek')
    const changed = changeLayoutAt(edited, 0, 'lista')
    const slide = changed.history.present.slides[0]
    expect(slide.layout).toBe('lista')
    expect(slide.data.heading).toBe('Mój nagłówek')
    // Klucze nowego układu - dokładnie z jego wartości domyślnych.
    expect(Object.keys(slide.data).sort()).toEqual(Object.keys(layoutOf('lista')!.defaults).sort())
    // Pola, których „karty" nie mają, przychodzą z domyślnych „listy".
    expect(slide.data.entries).toEqual(layoutOf('lista')!.defaults.entries)
  })

  it('migracja: lista o innych polach pozycji nie przechodzi, za długa jest przycinana', () => {
    const cards: SlideItem[] = Array.from({ length: 6 }, (_, i) => ({ title: `T${i}`, text: `O${i}` }))
    // `tags` w mozaice to pozycje {text} - karty {title, text} do nich nie pasują.
    const mozaika = migrateData({ tags: cards }, 'mozaika')
    expect(mozaika.tags).toEqual(layoutOf('mozaika')!.defaults.tags)
    // Lista o tych samych polach (karty → wpisy listy, max 5) - przycięta do limitu.
    const lista = migrateData({ entries: cards }, 'lista')
    expect(lista.entries).toHaveLength(5)
    // Zły typ (tekst zamiast przełącznika) - wartość domyślna.
    expect(migrateData({ showPhoto: 'tak' }, 'lista').showPhoto).toBe(true)
  })

  it('przepełnienie: zgłoszenia z dwóch źródeł nie kasują się nawzajem', () => {
    let map = reportOverflow({}, 's1', 'strip:heading', true)
    map = reportOverflow(map, 's1', 'canvas:heading', true)
    map = reportOverflow(map, 's1', 'canvas:heading', false)
    expect(map.s1?.size).toBe(1)
    map = reportOverflow(map, 's1', 'strip:heading', false)
    expect(map.s1).toBeUndefined()
    expect(reportOverflow(map, 's1', 'x', false)).toBe(map)
  })
})

describe('skróty edytora prezentacji', () => {
  const key = (k: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>> = {}) => ({
    key: k, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods,
  })

  it('Ctrl na Windows, ⌘ na Macu', () => {
    expect(deckShortcutFor(key('z', { ctrlKey: true }), false)).toBe('undo')
    expect(deckShortcutFor(key('z', { metaKey: true }), true)).toBe('undo')
    expect(deckShortcutFor(key('z', { ctrlKey: true }), true)).toBeNull()
    expect(deckShortcutFor(key('Z', { ctrlKey: true, shiftKey: true }), false)).toBe('redo')
    expect(deckShortcutFor(key('y', { ctrlKey: true }), false)).toBe('redo')
    expect(deckShortcutFor(key('d', { ctrlKey: true }), false)).toBe('duplicate')
    expect(deckShortcutFor(key('m', { ctrlKey: true }), false)).toBe('newSlide')
    expect(deckShortcutFor(key('Enter', { ctrlKey: true }), false)).toBe('showFromStart')
  })

  it('pokaz, usuwanie i przełączanie slajdów', () => {
    expect(deckShortcutFor(key('F5'), false)).toBe('showFromStart')
    expect(deckShortcutFor(key('F5', { shiftKey: true }), false)).toBe('showFromCurrent')
    expect(deckShortcutFor(key('Delete'), false)).toBe('remove')
    expect(deckShortcutFor(key('Backspace'), false)).toBe('remove')
    expect(deckShortcutFor(key('PageUp'), false)).toBe('prevSlide')
    expect(deckShortcutFor(key('PageDown'), false)).toBe('nextSlide')
    expect(deckShortcutFor(key('a'), false)).toBeNull()
    expect(deckShortcutFor(key('z', { ctrlKey: true, altKey: true }), false)).toBeNull()
  })
})

describe('przeciąganie w pasku miniatur', () => {
  it('szczelina z pozycji wskaźnika i docelowy indeks', () => {
    const centers = [50, 150, 250]
    expect(dropSlot(10, centers)).toBe(0)
    expect(dropSlot(160, centers)).toBe(2)
    expect(dropSlot(400, centers)).toBe(3)
    // Slajd 0 przed slajd 2 (szczelina 2) → indeks 1; na koniec (3) → indeks 2.
    expect(slotToIndex(0, 2)).toBe(1)
    expect(slotToIndex(0, 3)).toBe(2)
    expect(slotToIndex(2, 0)).toBe(0)
  })
})

describe('DeckList', () => {
  const props = { ready: true, error: null, onCreate: noop, onOpen: noop, onDuplicate: noop, onRemove: noop, now: 1_000_000 }

  it('pusta lista tłumaczy, czym są prezentacje, i proponuje szablon', () => {
    const html = render(h(DeckList, { ...props, items: [] }))
    expect(html).toContain('Nie masz jeszcze żadnej prezentacji')
    expect(html).toContain('Poznajmy się')
    expect(html).toContain('Nowa prezentacja')
  })

  it('karta: nazwa, liczba slajdów z odmianą i akcje', () => {
    const items = [
      { id: 'a', name: 'Dzień otwarty', updatedAt: 1_000_000 - 5000, slideCount: 3, firstLayout: 'tytul' },
      { id: 'b', name: 'Spotkanie', updatedAt: 0, slideCount: 12, firstLayout: null },
    ]
    const html = render(h(DeckList, { ...props, items }))
    expect(html).toContain('Dzień otwarty')
    expect(html).toContain('3 slajdy')
    expect(html).toContain('12 slajdów')
    expect(html).toContain('przed chwilą')
    expect(html).toContain('Duplikuj: Spotkanie')
    expect(html).not.toContain('Nie masz jeszcze')
  })

  it('w trakcie wczytywania nie pokazuje pustego stanu', () => {
    const html = render(h(DeckList, { ...props, ready: false, items: [] }))
    expect(html).toContain('Wczytywanie prezentacji')
    expect(html).not.toContain('Nie masz jeszcze')
  })
})

describe('Inspector', () => {
  const inspect = (layout: string) =>
    render(h(Inspector, { slide: createSlide(layout), theme: 'granat', aspect: '16:9', onData: noop, onChangeLayout: noop }))

  it('„lista": kontrolka na każde pole - wpisy, przełącznik, zdjęcie', () => {
    const html = inspect('lista')
    const layout = layoutOf('lista')!
    expect(html).toContain('Lista z opisami')
    expect(html).toContain('Zmień układ')
    // Lista: dwa wpisy, każdy z tytułem (input) i opisem (textarea), plus dodawanie.
    expect(html.match(/<textarea/g)).toHaveLength(2)
    expect(html).toContain('Wpis 1')
    expect(html).toContain('Dodaj: wpis')
    // Przełącznik.
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('Zdjęcie obok')
    // Zdjęcie - wybór pliku.
    expect(html).toContain('type="file"')
    for (const field of layout.fields) expect(html).toContain(field.label)
  })

  it('min listy blokuje usuwanie ostatniej pozycji', () => {
    const slide = createSlide('lista')
    slide.data.entries = [{ title: 'Jedyny', text: '' }]
    const html = render(h(Inspector, { slide, theme: 'granat', aspect: '16:9', onData: noop, onChangeLayout: noop }))
    expect(html).toMatch(/<button[^>]*aria-label="Usuń: Wpis 1"[^>]*disabled=""/)
  })

  it('układ bez pól odsyła do edycji na slajdzie', () => {
    expect(inspect('tytul')).toContain('Ten układ edytujesz bezpośrednio na slajdzie.')
  })
})

describe('format podglądu a historia', () => {
  it('cofnięcie treści nie przełącza formatu z powrotem', () => {
    let state = initEditor(deckOf('cytat'))
    state = setTextAt(state, 0, 'author', 'Ktoś', 1)
    state = setViewAspectIn(state, '1:1')
    state = undoIn(state)
    expect(state.history.present.viewAspect).toBe('1:1')
    expect(state.history.present.slides[0].data.author).not.toBe('Ktoś')
    state = redoIn(state)
    expect(state.history.present.viewAspect).toBe('1:1')
    expect(state.history.present.slides[0].data.author).toBe('Ktoś')
  })
})
