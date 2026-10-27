import type { SlideDefinition } from '../defineSlide'
import Cytat from './Cytat'

// JEDYNA lista układów slajdów. Kolejność = kolejność w galerii „Nowy slajd"
// (w obrębie grupy). Nowy układ: plik w tym folderze + jedna linia tutaj.
export const SLIDE_LAYOUTS: readonly SlideDefinition[] = [Cytat]

export const LAYOUT_BY_KEY: Readonly<Record<string, SlideDefinition>> = Object.fromEntries(SLIDE_LAYOUTS.map((layout) => [layout.key, layout]))

export function layoutOf(key: string): SlideDefinition | undefined {
  return LAYOUT_BY_KEY[key]
}
