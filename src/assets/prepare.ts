// Przygotowanie wgranej grafiki do przechowania: duże zdjęcia są zmniejszane,
// żeby nie zapychać IndexedDB ani Storage, a plik, który mimo to nie mieści
// się w limicie kubełka, jest odrzucany od razu - inaczej każdy późniejszy
// zapis projektu w chmurze kończyłby się błędem.

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/svg+xml'
type RasterMime = Exclude<ImageMime, 'image/svg+xml'>

// Największy plik, jaki przyjmie kubełek grafik. Odbicie `file_size_limit`
// z `supabase/migrations/20261008000000_projects_snapshots_assets.sql` -
// zmieniać razem.
export const MAX_ASSET_BYTES = 5 * 1024 * 1024
const MAX_ASSET_LABEL = `${MAX_ASSET_BYTES / (1024 * 1024)} MB`

// Plik, którego nie da się przyjąć. `message` jest po polsku i trafia wprost
// do użytkownika (obok pola, w którym wybrał plik).
export class ImageImportError extends Error {
  readonly reason: 'unsupported' | 'tooLarge'

  constructor(reason: 'unsupported' | 'tooLarge', message: string) {
    super(message)
    this.name = 'ImageImportError'
    this.reason = reason
  }
}

export const tooLargeError = (fileName: string) => new ImageImportError('tooLarge', `Plik „${fileName}" jest za duży. Limit to ${MAX_ASSET_LABEL}.`)

// Komunikat dla użytkownika po nieudanym wgraniu pliku.
export function importErrorMessage(error: unknown, fileName: string): string {
  if (error instanceof ImageImportError) return error.message
  return `Nie udało się wczytać pliku „${fileName}". Spróbuj ponownie albo wybierz inny plik.`
}

const JPEG_MAX_LONG_SIDE = 3000
const JPEG_QUALITY = 0.85
// Logotypy: mniejszy limit, ale format zostaje - PNG niesie przezroczystość.
const PNG_MAX_LONG_SIDE = 2000

// Kolejne próby, gdy plik po zakodowaniu przekracza limit kubełka.
const JPEG_QUALITIES = [JPEG_QUALITY, 0.7]
const JPEG_SCALES = [1, 0.8, 0.65, 0.5, 0.35]
// PNG nie ma jakości - zostają same wymiary. Przy ostatnim kroku nawet
// nieskompresowane piksele (4 bajty każdy) mieszczą się w limicie.
const PNG_SCALES = [1, 0.85, 0.7, 0.55, 0.4]

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
  throw new ImageImportError('unsupported', `Nieobsługiwany format grafiki (${mime || 'nieznany'}). Wgraj plik JPG, PNG albo SVG.`)
}

// Typ pliku; gdy przeglądarka go nie poda (zdarza się przy SVG), z rozszerzenia.
export function mimeOfFile(file: { type: string; name: string }): ImageMime {
  if (file.type) return outputType(file.type)
  const extension = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
  return outputType(MIME_OF_EXTENSION[extension] ?? '')
}

// Jedna próba zakodowania: wymiary i (dla JPEG) jakość.
export interface EncodeStep {
  width: number
  height: number
  quality?: number
}

// Próby w kolejności od najlepszej: pierwsza to podane wymiary w domyślnej
// jakości, każda następna daje mniejszy plik. JPEG najpierw traci jakość,
// potem wymiary; PNG tylko wymiary.
export function shrinkSteps(type: RasterMime, width: number, height: number): EncodeStep[] {
  const jpeg = type === 'image/jpeg'
  const steps: EncodeStep[] = []
  let last = ''
  for (const scale of jpeg ? JPEG_SCALES : PNG_SCALES) {
    const size = { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
    // Malutka grafika: po zaokrągleniu kolejny krok bywa tym samym.
    const key = `${size.width}x${size.height}`
    if (key === last) continue
    last = key
    if (jpeg) for (const quality of JPEG_QUALITIES) steps.push({ ...size, quality })
    else steps.push(size)
  }
  return steps
}

// Koduje kolejne próby, aż któraś zmieści się w limicie. `null` = żadna.
export async function firstWithin(steps: EncodeStep[], encodeStep: (step: EncodeStep) => Promise<Blob>, maxBytes: number): Promise<Blob | null> {
  for (const step of steps) {
    const blob = await encodeStep(step)
    if (blob.size <= maxBytes) return blob
  }
  return null
}

function encode(canvas: HTMLCanvasElement, type: ImageMime, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Nie udało się zapisać grafiki'))), type, quality)
  })
}

function render(bitmap: ImageBitmap, type: RasterMime, step: EncodeStep): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = step.width
  canvas.height = step.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Nie udało się zmniejszyć grafiki')
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, step.width, step.height)
  return encode(canvas, type, step.quality)
}

// JPEG: dłuższy bok najwyżej 3000 px, jakość 0,85. PNG: najwyżej 2000 px,
// zostaje PNG. SVG i grafiki mieszczące się w obu limitach (wymiarów
// i bajtów): oryginalne bajty. Raster za ciężki dla kubełka jest kodowany
// coraz mniejszy (`shrinkSteps`); gdy nic nie pomaga - i dla za dużego SVG,
// którego nie umiemy zmniejszyć - plik jest odrzucany (`ImageImportError`).
//
// Tylko przeglądarka: dekodowanie i canvas nie istnieją w środowisku testów
// (node), dlatego cała logika wymiarów, formatu i rozmiaru siedzi w funkcjach
// wyżej, a ta zostaje cienka. Poza ścieżką SVG sprawdzana ręcznie.
export async function prepareImage(file: File): Promise<Blob> {
  const type = mimeOfFile(file)
  const original = file.type === type ? file : new Blob([file], { type })
  if (type === 'image/svg+xml') {
    if (original.size > MAX_ASSET_BYTES) throw tooLargeError(file.name)
    return original
  }

  const bitmap = await createImageBitmap(file)
  try {
    const size = fitWithin(bitmap.width, bitmap.height, type === 'image/jpeg' ? JPEG_MAX_LONG_SIDE : PNG_MAX_LONG_SIDE)
    const untouched = size.width === bitmap.width && size.height === bitmap.height
    if (untouched && original.size <= MAX_ASSET_BYTES) return original

    const blob = await firstWithin(shrinkSteps(type, size.width, size.height), (step) => render(bitmap, type, step), MAX_ASSET_BYTES)
    if (!blob) throw tooLargeError(file.name)
    return blob
  } finally {
    bitmap.close()
  }
}
