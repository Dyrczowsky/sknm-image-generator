// Przygotowanie wgranej grafiki do przechowania: duże zdjęcia są zmniejszane,
// żeby nie zapychać IndexedDB ani Storage (limit pliku w kubełku to 5 MB).

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/svg+xml'

const JPEG_MAX_LONG_SIDE = 3000
const JPEG_QUALITY = 0.85
// Logotypy: mniejszy limit, ale format zostaje - PNG niesie przezroczystość.
const PNG_MAX_LONG_SIDE = 2000

const MIME_OF_EXTENSION: Record<string, ImageMime> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
}

// Wymiary po wpasowaniu dłuższego boku w limit. Nigdy nie powiększa.
export function fitWithin(width: number, height: number, maxLongSide: number): { width: number; height: number } {
  const longSide = Math.max(width, height)
  if (longSide <= maxLongSide) return { width, height }
  const scale = maxLongSide / longSide
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

// Format, w jakim grafika jest przechowywana - ten sam co wejściowy.
export function outputType(mime: string): ImageMime {
  if (mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/svg+xml') return mime
  throw new Error(`Nieobsługiwany format grafiki: ${mime || 'nieznany'}`)
}

// Typ pliku; gdy przeglądarka go nie poda (zdarza się przy SVG), z rozszerzenia.
export function mimeOfFile(file: { type: string; name: string }): ImageMime {
  if (file.type) return outputType(file.type)
  const extension = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
  return outputType(MIME_OF_EXTENSION[extension] ?? '')
}

function encode(canvas: HTMLCanvasElement, type: ImageMime, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Nie udało się zapisać grafiki'))), type, quality)
  })
}

// JPEG: dłuższy bok najwyżej 3000 px, jakość 0,85. PNG: najwyżej 2000 px,
// zostaje PNG. SVG i grafiki mieszczące się w limicie: oryginalne bajty.
//
// Tylko przeglądarka: dekodowanie i canvas nie istnieją w środowisku testów
// (node), dlatego cała logika wymiarów i formatu siedzi w funkcjach wyżej,
// a ta zostaje cienka. Sprawdzana ręcznie.
export async function prepareImage(file: File): Promise<Blob> {
  const type = mimeOfFile(file)
  const original = file.type === type ? file : new Blob([file], { type })
  if (type === 'image/svg+xml') return original

  const bitmap = await createImageBitmap(file)
  try {
    const size = fitWithin(bitmap.width, bitmap.height, type === 'image/jpeg' ? JPEG_MAX_LONG_SIDE : PNG_MAX_LONG_SIDE)
    if (size.width === bitmap.width && size.height === bitmap.height) return original

    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Nie udało się zmniejszyć grafiki')
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    return await encode(canvas, type, type === 'image/jpeg' ? JPEG_QUALITY : undefined)
  } finally {
    bitmap.close()
  }
}
