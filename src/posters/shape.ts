import { createContext, useContext } from 'react'
import type { PosterShape } from '../types'

// Rozmiar układu (CSS px) każdego kształtu, na dotychczasowej skali 1080.
// A2/A3/A4 mają tę samą proporcję, więc format papieru zmienia tylko
// rozdzielczość eksportu (patrz formats.ts), nigdy układ.
export const SHAPE_SIZE: Record<PosterShape, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1528 },
  landscape: { width: 1528, height: 1080 },
}

// Domyślnie kwadrat: wszystko, co nie podaje kształtu (miniatury szablonów,
// swatche, historia), renderuje się jak dotychczas.
export const PosterShapeContext = createContext<PosterShape>('square')

// `kx`/`ky` = ile razy ramka jest szersza/wyższa od kwadratu — do skalowania
// elementów o stałych wymiarach (kliny, zdjęcia).
export function usePosterShape() {
  const shape = useContext(PosterShapeContext)
  const { width, height } = SHAPE_SIZE[shape]
  return { shape, width, height, kx: width / 1080, ky: height / 1080 }
}
