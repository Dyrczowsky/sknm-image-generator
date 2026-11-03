import { describe, expect, it } from 'vitest'
import { layoutOf } from './komponenty'
import { parseDeck } from './deck'
import { createStarterDeck } from './starter'

describe('createStarterDeck', () => {
  const deck = createStarterDeck()

  it('ma nazwę i 11 slajdów', () => {
    expect(deck.name).toBe('Poznajmy się')
    expect(deck.slides).toHaveLength(11)
  })

  it('układy w kolejności wzorcowej prezentacji', () => {
    expect(deck.slides.map((s) => s.layout)).toEqual([
      'tytul',
      'tekstZdjecia',
      'tekstZdjecia',
      'tekstZdjecia',
      'tekstZdjecia',
      'lista',
      'tekstZdjecia',
      'mozaika',
      'karty',
      'karty',
      'zaproszenie',
    ])
  })

  it('klucze danych każdego slajdu są dokładnie kluczami defaults układu', () => {
    for (const slide of deck.slides) {
      const layout = layoutOf(slide.layout)
      expect(layout).toBeDefined()
      expect(Object.keys(slide.data).sort()).toEqual(Object.keys(layout!.defaults).sort())
    }
  })

  it('slajd tytułowy zawiera nazwę koła', () => {
    const title = deck.slides[0].data
    expect(String(title.title)).toContain('Studenckie Koło Naukowe Matematyków')
  })

  it('tła, odwrócenia i odsłanianie zgodne z wzorcem', () => {
    expect(deck.slides[0].background).toBe('ciemne')
    expect(deck.slides[10].background).toBe('ciemne')
    expect(deck.slides.filter((s) => s.mirrored)).toHaveLength(3)
    expect(deck.slides[2].mirrored).toBe(true)
    expect(deck.slides[4].mirrored).toBe(true)
    expect(deck.slides[6].mirrored).toBe(true)
    expect(deck.slides.filter((s) => s.reveal).map((s) => s.layout)).toEqual(['lista', 'karty', 'karty'])
  })

  it('w tekstach nie ma twardych spacji', () => {
    expect(JSON.stringify(deck)).not.toContain(' ')
  })

  it('przechodzi przez JSON i parseDeck bez zmian', () => {
    const json = JSON.parse(JSON.stringify(deck))
    const parsed = parseDeck(json)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.deck).toEqual(deck)
  })
})
