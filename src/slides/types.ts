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

// Zdjęcie w slajdzie. W stanie aplikacji `src` to data URL (jak w plakatach);
// zapis w IndexedDB trzyma zamiast niego nazwę grafiki (ref) - patrz deckStore.
// `x`/`y` - kadr w procentach (0-100), `zoom` - 1 = dopasowane do kadru.
export interface PhotoValue {
  src: string | null
  x: number
  y: number
  zoom: number
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

export const DECK_VERSION = 1
