import { isAssetRef } from '../assets/hash'

// Typy prezentacji. Jedna prezentacja (Deck) ma tę samą treść w obu
// formatach - 16:9 i 1:1 - a każdy układ slajdu sam przestawia się na kwadrat.

export type SlideAspect = '16:9' | '1:1'

// Motyw kolorów całej prezentacji (themes.ts).
export type SlideThemeKey = 'granat' | 'kremowy' | 'ciemny'

// Tło pojedynczego slajdu w ramach motywu: jasne (domyślne) albo ciemne
// (granatowy slajd tytułowy / zaproszenie z prezentacji wzorcowej).
export type SlideBackground = 'jasne' | 'ciemne'

export type TransitionKey =
  | 'brak'
  | 'przenikanie'
  | 'wypchniecie'
  | 'wsuniecie'
  | 'odsloniecie'
  | 'przyblizenie'
  | 'wymazanie'
  | 'trojkaty'
  | 'obrot'
  | 'rozmycie'

// Kolejność = kolejność w galerii przejść.
export const TRANSITION_KEYS: readonly TransitionKey[] = [
  'brak',
  'przenikanie',
  'wypchniecie',
  'wsuniecie',
  'odsloniecie',
  'przyblizenie',
  'wymazanie',
  'trojkaty',
  'obrot',
  'rozmycie',
]

// Zdjęcie w slajdzie. W stanie aplikacji `src` to data URL (jak w plakatach);
// zapis w IndexedDB trzyma zamiast niego nazwę grafiki (ref) - patrz deckStore.
// `x`/`y` - kadr w procentach (0-100), `zoom` - 1 = dopasowane do kadru.
export interface PhotoValue {
  src: string | null
  x: number
  y: number
  zoom: number
}

export const EMPTY_PHOTO: PhotoValue = { src: null, x: 50, y: 50, zoom: 1 }

// Adres do narysowania zdjęcia. `src` będący nazwą grafiki (`<sha256>.<ext>`)
// to grafika, której nie udało się wczytać z tego urządzenia - zostaje w
// danych (zapis jej nie gubi), a slajd rysuje puste miejsce na zdjęcie.
export function photoSrc(photo: PhotoValue): string | null {
  return photo.src && !isAssetRef(photo.src) ? photo.src : null
}

// Pozycja listy (karty, wpisy, tagi, wiersze agendy): same pola tekstowe.
export type SlideItem = Record<string, string>

export type SlideValue = string | boolean | PhotoValue | SlideItem[]

// Treść slajdu - kształt wynika z `defaults` układu (defineSlide).
export type SlideData = Record<string, SlideValue>

export interface Slide {
  id: string
  // Klucz układu z `komponenty/index.ts`.
  layout: string
  data: SlideData
  background: SlideBackground
  // Lustrzane odbicie układu (tekst po prawej, zdjęcia po lewej).
  mirrored: boolean
  // Elementy (karty, wpisy, tagi) pojawiają się po kolei, kliknięcie po kliknięciu.
  reveal: boolean
  // Przejście NA ten slajd; brak = domyślne przejście prezentacji.
  transition?: TransitionKey
}

export interface Deck {
  v: number
  id: string
  name: string
  theme: SlideThemeKey
  transition: TransitionKey
  // Czas przejścia w ms (300-1000).
  duration: number
  // Ostatni wybór przełącznika formatu w edytorze (tylko UI, eksport pyta osobno).
  viewAspect: SlideAspect
  slides: Slide[]
  updatedAt: number
}

// v2: teksty slajdów mogą nieść formatowanie; starsze zapisy czytane bez zmian.
export const DECK_VERSION = 2

export const MIN_DURATION = 300
export const MAX_DURATION = 1000
export const DEFAULT_DURATION = 600
