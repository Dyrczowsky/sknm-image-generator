import { describe, expect, it } from 'vitest'
import {
  addSlide,
  createDeck,
  createSlide,
  duplicateSlide,
  moveSlide,
  newId,
  parseDeck,
  removeSlide,
  setDataPath,
  setDeckProps,
  updateSlide,
} from './deck'
import { DECK_VERSION, DEFAULT_DURATION, MAX_DURATION, MIN_DURATION } from './types'

function deckOf(n: number) {
  const slides = Array.from({ length: n }, (_, i) => {
    const s = createSlide('cytat')
    s.data.author = `A${i}`
    return s
  })
  return createDeck('Test', slides)
}

const authors = (d: { slides: { data: Record<string, unknown> }[] }) => d.slides.map((s) => s.data.author)

describe('newId / createSlide / createDeck', () => {
  it('daje różne identyfikatory', () => {
    expect(newId()).not.toBe(newId())
  })

  it('createSlide kopiuje domyślną treść układu', () => {
    const a = createSlide('cytat')
    const b = createSlide('cytat')
    expect(a.layout).toBe('cytat')
    expect(a.background).toBe('jasne')
    expect(a.mirrored).toBe(false)
    expect(a.reveal).toBe(false)
    expect(a.transition).toBeUndefined()
    expect(a.data).toEqual(b.data)
    expect(a.data).not.toBe(b.data)
    expect(a.id).not.toBe(b.id)
  })

  it('createSlide rzuca dla nieznanego układu', () => {
    expect(() => createSlide('nie-ma')).toThrow()
  })

  it('createDeck ustawia wartości domyślne', () => {
    const d = createDeck('X')
    expect(d).toMatchObject({ v: DECK_VERSION, name: 'X', theme: 'granat', transition: 'przenikanie', duration: DEFAULT_DURATION, viewAspect: '16:9', slides: [] })
    expect(typeof d.updatedAt).toBe('number')
  })
})

describe('operacje na slajdach', () => {
  it('addSlide dodaje na koniec lub po wskazanym indeksie', () => {
    const d = deckOf(2)
    const s = createSlide('cytat')
    s.data.author = 'N'
    const frozen = JSON.stringify(d)
    expect(authors(addSlide(d, s))).toEqual(['A0', 'A1', 'N'])
    expect(authors(addSlide(d, s, 0))).toEqual(['A0', 'N', 'A1'])
    expect(JSON.stringify(d)).toBe(frozen)
  })

  it('duplicateSlide robi głęboką kopię z nowym id tuż za oryginałem', () => {
    const d = deckOf(2)
    const frozen = JSON.stringify(d)
    const out = duplicateSlide(d, 0)
    expect(out.slides).toHaveLength(3)
    expect(out.slides[1].id).not.toBe(out.slides[0].id)
    expect(out.slides[1].data).toEqual(out.slides[0].data)
    expect(out.slides[1].data).not.toBe(out.slides[0].data)
    expect(JSON.stringify(d)).toBe(frozen)
    expect(duplicateSlide(d, 9)).toBe(d)
  })

  it('removeSlide usuwa slajd', () => {
    const d = deckOf(3)
    const frozen = JSON.stringify(d)
    expect(authors(removeSlide(d, 1))).toEqual(['A0', 'A2'])
    expect(removeSlide(d, 5)).toBe(d)
    expect(JSON.stringify(d)).toBe(frozen)
  })

  it('moveSlide przenosi na docelowy indeks i obcina zakres', () => {
    const d = deckOf(4)
    const frozen = JSON.stringify(d)
    expect(authors(moveSlide(d, 0, 2))).toEqual(['A1', 'A2', 'A0', 'A3'])
    expect(authors(moveSlide(d, 3, 0))).toEqual(['A3', 'A0', 'A1', 'A2'])
    expect(authors(moveSlide(d, 1, 99))).toEqual(['A0', 'A2', 'A3', 'A1'])
    expect(authors(moveSlide(d, 2, -5))).toEqual(['A2', 'A0', 'A1', 'A3'])
    expect(moveSlide(d, 1, 1)).toBe(d)
    expect(moveSlide(d, 9, 0)).toBe(d)
    expect(JSON.stringify(d)).toBe(frozen)
  })

  it('updateSlide łączy poprawkę i nie zmienia id', () => {
    const d = deckOf(2)
    const frozen = JSON.stringify(d)
    const out = updateSlide(d, 1, { mirrored: true, transition: 'obrot' })
    expect(out.slides[1]).toMatchObject({ mirrored: true, transition: 'obrot', id: d.slides[1].id })
    expect(out.slides[0]).toBe(d.slides[0])
    expect(JSON.stringify(d)).toBe(frozen)
    expect(updateSlide(d, 7, { reveal: true })).toBe(d)
  })

  it('nie dotyka updatedAt', () => {
    const d = { ...deckOf(1), updatedAt: 5 }
    expect(removeSlide(updateSlide(d, 0, { reveal: true }), 0).updatedAt).toBe(5)
  })
})

describe('setDataPath', () => {
  it('ustawia pole najwyższego poziomu bez mutacji', () => {
    const d = deckOf(1)
    const frozen = JSON.stringify(d)
    const out = setDataPath(d, 0, 'quote', 'Nowy')
    expect(out.slides[0].data.quote).toBe('Nowy')
    expect(JSON.stringify(d)).toBe(frozen)
  })

  it('ustawia pole zagnieżdżone w tablicy', () => {
    const d = deckOf(1)
    d.slides[0].data.cards = [{ title: 'a' }, { title: 'b' }, { title: 'c' }]
    const frozen = JSON.stringify(d)
    const out = setDataPath(d, 0, 'cards.2.title', 'C!')
    expect(out.slides[0].data.cards).toEqual([{ title: 'a' }, { title: 'b' }, { title: 'C!' }])
    const cards = d.slides[0].data.cards as unknown[]
    expect((out.slides[0].data.cards as unknown[])[0]).toBe(cards[0])
    expect(JSON.stringify(d)).toBe(frozen)
  })

  it('zwraca prezentację bez zmian dla złej ścieżki', () => {
    const d = deckOf(1)
    d.slides[0].data.cards = [{ title: 'a' }]
    expect(setDataPath(d, 0, 'nie.ma', 'x')).toBe(d)
    expect(setDataPath(d, 0, 'cards.5.title', 'x')).toBe(d)
    expect(setDataPath(d, 0, 'cards.x.title', 'x')).toBe(d)
    expect(setDataPath(d, 0, 'cards.0.nie', 'x')).toBe(d)
    expect(setDataPath(d, 0, '', 'x')).toBe(d)
    expect(setDataPath(d, 3, 'quote', 'x')).toBe(d)
  })
})

describe('setDeckProps', () => {
  it('ustawia pola i przycina czas przejścia', () => {
    const d = deckOf(0)
    const frozen = JSON.stringify(d)
    expect(setDeckProps(d, { name: 'Nowa', theme: 'ciemny', viewAspect: '1:1' })).toMatchObject({ name: 'Nowa', theme: 'ciemny', viewAspect: '1:1' })
    expect(setDeckProps(d, { duration: 5 }).duration).toBe(MIN_DURATION)
    expect(setDeckProps(d, { duration: 99999 }).duration).toBe(MAX_DURATION)
    expect(JSON.stringify(d)).toBe(frozen)
  })
})

describe('parseDeck', () => {
  it('śmieci to invalid', () => {
    expect(parseDeck(null)).toEqual({ ok: false, reason: 'invalid' })
    expect(parseDeck('x')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseDeck([])).toEqual({ ok: false, reason: 'invalid' })
    expect(parseDeck({ name: 'bez id' })).toEqual({ ok: false, reason: 'invalid' })
  })

  it('nowsza wersja to newer', () => {
    expect(parseDeck({ id: 'a', v: DECK_VERSION + 1 })).toEqual({ ok: false, reason: 'newer' })
  })

  it('starszy zapis (v 1) jest przyjmowany i podnoszony do v 2', () => {
    const res = parseDeck({ id: 'a', v: 1, slides: [] })
    expect(res.ok && res.deck.v).toBe(2)
  })

  it('naprawia brakujące i błędne pola', () => {
    const res = parseDeck({ id: 'a', theme: 'x', transition: 5, duration: 1, viewAspect: '4:3', updatedAt: 'x', slides: 'nie' })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.deck).toMatchObject({ id: 'a', name: 'Prezentacja', theme: 'granat', transition: 'przenikanie', duration: MIN_DURATION, viewAspect: '16:9', updatedAt: 0, slides: [] })
  })

  it('pomija slajdy, które nie są obiektami', () => {
    const good = createSlide('cytat')
    const res = parseDeck({ id: 'a', slides: [good, 5, null] })
    expect(res.ok && res.deck.slides.map((s) => s.id)).toEqual([good.id])
  })

  it('slajd nieznanego układu = prezentacja z nowszej wersji (nie kasujemy go autozapisem)', () => {
    const res = parseDeck({ id: 'a', slides: [createSlide('cytat'), { layout: 'nie-ma' }] })
    expect(res).toEqual({ ok: false, reason: 'newer' })
  })

  it('błędny typ pola wraca do domyślnego, nieznane klucze znikają', () => {
    const good = createSlide('cytat')
    const raw = {
      id: 'a',
      slides: [{ ...good, id: 7, background: 'x', mirrored: 'tak', transition: 'zły', data: { quote: 12, author: 'Ja', obce: 'x' } }],
    }
    const res = parseDeck(raw)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const s = res.deck.slides[0]
    expect(typeof s.id).toBe('string')
    expect(s.background).toBe('jasne')
    expect(s.mirrored).toBe(false)
    expect(s.transition).toBeUndefined()
    expect(s.data).toEqual({ kicker: good.data.kicker, quote: good.data.quote, author: 'Ja' })
  })

  it('poprawna prezentacja przechodzi przez JSON bez zmian', () => {
    const d = setDeckProps(deckOf(3), { theme: 'kremowy', duration: 800 })
    d.slides[1].transition = 'obrot'
    d.slides[2].mirrored = true
    const res = parseDeck(JSON.parse(JSON.stringify(d)))
    expect(res).toEqual({ ok: true, deck: d })
  })
})
