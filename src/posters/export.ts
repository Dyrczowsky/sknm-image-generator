import { toCanvas, toPng } from 'html-to-image'
import type { FileType, Orientation, PosterShape } from '../types'
import { DPI_LADDER, withDpiLadder } from './dpiLadder'
import { EXPORT_FORMATS, pageSizePt, pixelSize } from './formats'
import type { PaperSize } from './formats'
import { buildPdf } from './pdf'
import { rgbaToRgb } from './rgb'
import { SHAPE_SIZE } from './shape'

interface Size {
  width: number
  height: number
}

export interface DownloadOptions {
  formatKey: string
  orientation: Orientation
  fileType: FileType
}

// Piksel tuż przy rogu plakatu: jego kolor to tło plakatu, a jego alfa mówi,
// czy przeglądarka w ogóle coś narysowała.
const CORNER = 4

// Ile czasu przeglądarka ma na rozpoczęcie pobierania, zanim zwolnimy blob.
const BLOB_URL_TTL_MS = 10_000

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('brak kontekstu 2d')
  return ctx
}

function createCanvas({ width, height }: Size): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e instanceof Error ? e : new Error('image load failed'))
    img.src = src
  })
}

function saveAs(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  saveAs(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_TTL_MS)
}

// Centruje plakat na płótnie o zadanych wymiarach. Tło poza plakatem dostaje
// kolor odczytany z jego własnego rogu, żeby dostawka nie wyglądała jak
// przypadkowa biała ramka wokół kolorowych szablonów.
async function compositeOnCanvas(posterDataUrl: string, size: Size): Promise<string> {
  const img = await loadImage(posterDataUrl)
  if (size.width === img.width && size.height === img.height) return posterDataUrl

  const source = context2d(createCanvas(img))
  source.drawImage(img, 0, 0)
  const [r, g, b, a] = source.getImageData(CORNER, CORNER, 1, 1).data

  const canvas = createCanvas(size)
  const ctx = context2d(canvas)
  ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
  ctx.fillRect(0, 0, size.width, size.height)
  ctx.drawImage(img, (size.width - img.width) / 2, (size.height - img.height) / 2)

  return canvas.toDataURL('image/png')
}

// Rasteryzuje węzeł plakatu (w rozmiarze układu `shape`) do canvasu
// o dokładnych wymiarach docelowych w px (papier albo baner). Za duży canvas
// przeglądarka oddaje pusty (przezroczysty) - plakat jest nieprzezroczysty,
// więc alfa 0 w rogu oznacza porażkę i rzucamy, żeby drabinka zeszła na
// niższe dpi.
async function rasterise(node: HTMLElement, shape: PosterShape, target: Size): Promise<HTMLCanvasElement> {
  const layout = SHAPE_SIZE[shape]
  const canvas = await toCanvas(node, {
    width: layout.width,
    height: layout.height,
    canvasWidth: target.width,
    canvasHeight: target.height,
    pixelRatio: 1,
    skipAutoScale: true,
  })
  if (canvas.width !== target.width || canvas.height !== target.height) throw new Error('canvas ma inny rozmiar niż żądany')
  if (context2d(canvas).getImageData(CORNER, CORNER, 1, 1).data[3] === 0) throw new Error('pusty canvas')
  return canvas
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob zwrócił null'))), 'image/png')
  })
}

// zlib/deflate przez natywny CompressionStream - format, którego oczekuje
// filtr /FlateDecode w PDF.
async function deflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function canvasToPdfBlob(canvas: HTMLCanvasElement, paper: PaperSize, orientation: Orientation): Promise<Blob> {
  const rgba = context2d(canvas).getImageData(0, 0, canvas.width, canvas.height).data
  const imageData = await deflate(rgbaToRgb(rgba))
  const page = pageSizePt(paper, orientation)
  const pdf = buildPdf({ widthPx: canvas.width, heightPx: canvas.height, widthPt: page.width, heightPt: page.height, imageData })
  return new Blob([pdf], { type: 'application/pdf' })
}

// Baner: PNG z układu banera, rasteryzowany wprost do rozmiaru formatu.
async function downloadBanner(node: HTMLElement, basename: string, shape: PosterShape, size: Size) {
  const canvas = await rasterise(node, shape, size)
  saveBlob(await canvasToPngBlob(canvas), `${basename}.png`)
}

// Social (kwadrat/story): PNG z układu kwadratowego; format wyższy niż kwadrat
// dostaje dostawkę w kolorze tła plakatu.
async function downloadSocial(node: HTMLElement, basename: string, size: Size) {
  const posterDataUrl = await toPng(node, { ...SHAPE_SIZE.square, pixelRatio: 1 })
  saveAs(await compositeOnCanvas(posterDataUrl, size), `${basename}.png`)
}

// Papier: PNG albo PDF w rozmiarze strony, przez drabinkę dpi. Zwraca
// rozdzielczość, która faktycznie się udała.
async function downloadPrint(node: HTMLElement, basename: string, paper: PaperSize, { orientation, fileType }: DownloadOptions): Promise<number> {
  const { dpi, result: blob } = await withDpiLadder(DPI_LADDER, async (attemptDpi) => {
    const canvas = await rasterise(node, orientation, pixelSize(paper, orientation, attemptDpi))
    return fileType === 'pdf' ? canvasToPdfBlob(canvas, paper, orientation) : canvasToPngBlob(canvas)
  })
  saveBlob(blob, `${basename}.${fileType}`)
  return dpi
}

// Pobiera plakat w wybranym formacie. `orientation`/`fileType` dotyczą tylko
// formatów papierowych - tylko dla nich wynik niesie `dpi`.
export async function downloadPoster(node: HTMLElement, basename: string, opts: DownloadOptions): Promise<{ dpi?: number }> {
  const format = EXPORT_FORMATS[opts.formatKey] ?? EXPORT_FORMATS.square
  if (format.paper) return { dpi: await downloadPrint(node, basename, format.paper, opts) }

  if (format.shape) await downloadBanner(node, basename, format.shape, format)
  else await downloadSocial(node, basename, format)
  return {}
}
