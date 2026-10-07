import { createContext, useContext } from 'react'
import type { PosterShape } from '../types'

// Rozmiar układu (CSS px) każdego kształtu, na dotychczasowej skali 1080.
// A2/A3/A4 mają tę samą proporcję, więc format papieru zmienia tylko
// rozdzielczość eksportu (patrz formats.ts), nigdy układ.
export const SHAPE_SIZE: Record<PosterShape, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1528 },
  landscape: { width: 1528, height: 1080 },
  // Banery mają wspólną wysokość układu (624), więc baner projektuje się
  // raz i jest płynny tylko na szerokość. `event` to okładka wydarzenia
  // 1920×1005 - ten sam układ rasteryzowany ×1,61 (patrz formats.ts).
  cover: { width: 1640, height: 624 },
  event: { width: 1192, height: 624 },
}

export function isBannerShape(shape: PosterShape): boolean {
  return shape === 'cover' || shape === 'event'
}

// Szerokość bezpiecznej kolumny banera. Facebook na telefonie przycina
// okładkę strony do środkowych ~68% (ok. 1109 z 1640 px), więc tekst, logo
// i QR trzymamy w środkowych 1096 px - na marginesy wychodzi tylko dekoracja
// i zdjęcia.
export const BANNER_SAFE_W = 1096
export const BANNER_PAD = 48

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

// Układ banera: `padX` to boczny margines treści (bezpieczna kolumna
// wyśrodkowana w ramce), `padY` - górny/dolny. Poza kształtem banera
// (np. miniatura bez providera) hook liczy z bieżącej ramki, bez wyjątku.
export function useBannerLayout() {
  const { shape, width, height } = usePosterShape()
  const padX = Math.max(BANNER_PAD, Math.round((width - BANNER_SAFE_W) / 2))
  return { shape, width, height, padX, padY: BANNER_PAD }
}
