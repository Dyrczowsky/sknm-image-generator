import type { SlideDefinition } from '../defineSlide'
import Cytat from './Cytat'
import Liczba from './Liczba'
import Sekcja from './Sekcja'
import TekstZdjecia from './TekstZdjecia'
import Tytul from './Tytul'
import Zdjecie from './Zdjecie'

// JEDYNA lista układów slajdów. Kolejność = kolejność w galerii „Nowy slajd"
// (w obrębie grupy). Nowy układ: plik w tym folderze + jedna linia tutaj.
export const SLIDE_LAYOUTS: readonly SlideDefinition[] = [Tytul, Sekcja, TekstZdjecia, Zdjecie, Cytat, Liczba]

export const LAYOUT_BY_KEY: Readonly<Record<string, SlideDefinition>> = Object.fromEntries(SLIDE_LAYOUTS.map((layout) => [layout.key, layout]))

export function layoutOf(key: string): SlideDefinition | undefined {
  return LAYOUT_BY_KEY[key]
}
