import { createDeck, createSlide } from './deck'
import type { Deck } from './types'

// SZKIC - pełną prezentację „Poznajmy się" (treść z prezentacji wzorcowej)
// dopisuje zadanie 13. Sygnatura zostaje.
export function createStarterDeck(): Deck {
  return createDeck('Poznajmy się', [createSlide('tytul'), createSlide('tekstZdjecia')])
}

// Pusta prezentacja: sam slajd tytułowy.
export function createEmptyDeck(): Deck {
  return createDeck('Nowa prezentacja', [createSlide('tytul')])
}
