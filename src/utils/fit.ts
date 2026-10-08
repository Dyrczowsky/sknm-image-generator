export interface Size {
  width: number
  height: number
}

// Największa szerokość (px), przy której prostokąt o proporcjach `shape`
// mieści się w `box` w OBU wymiarach, z marginesem `pad` z każdej strony.
// 0, gdy pudełko nie zostało jeszcze zmierzone albo nic się w nim nie zmieści.
export function fitWidth(box: Size, shape: Size, pad = 0): number {
  const width = box.width - 2 * pad
  const height = box.height - 2 * pad
  if (!(width > 0) || !(height > 0) || !(shape.width > 0) || !(shape.height > 0)) return 0
  return Math.floor(Math.min(width, (height * shape.width) / shape.height))
}

// Margines podglądu wewnątrz sceny: 4% krótszego boku, w granicach 8-28 px -
// na telefonie plakat prawie dotyka krawędzi, na dużym ekranie ma oddech.
export function stagePadding(box: Size): number {
  return Math.round(Math.min(28, Math.max(8, Math.min(box.width, box.height) * 0.04)))
}

// Siatka kafelków o stałej liczbie kolumn: ile kolumn o szerokości co najmniej
// `minTile` mieści się w `width` (z odstępem `gap`) i ile wtedy ma jedna.
export function tileGrid(width: number, minTile: number, gap: number): { columns: number; tile: number } {
  if (!(width > 0)) return { columns: 0, tile: 0 }
  const columns = Math.max(1, Math.floor((width + gap) / (minTile + gap)))
  return { columns, tile: Math.floor((width - gap * (columns - 1)) / columns) }
}
