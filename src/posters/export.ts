import { toCanvas, toPng } from 'html-to-image'
import type { FileType, Orientation } from '../types'
import { rgbaToCmyk } from './cmyk'
import { DPI_LADDER, withDpiLadder } from './dpiLadder'
import { EXPORT_FORMATS, pageSizePt, pixelSize } from './formats'
import type { PaperSize } from './formats'
import { buildPdf } from './pdf'
import { SHAPE_SIZE } from './shape'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e instanceof Error ? e : new Error('image load failed'))
    img.src = src
  })
}

// Centruje plakat na płótnie o zadanych wymiarach. Tło poza plakatem dostaje
// kolor odczytany z jego własnego rogu, żeby dostawka nie wyglądała jak
// przypadkowa biała ramka wokół kolorowych szablonów.
async function compositeOnCanvas(posterDataUrl: string, width: number, height: number): Promise<string> {
  const img = await loadImage(posterDataUrl)
  if (width === img.width && height === img.height) return posterDataUrl

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = img.width
  srcCanvas.height = img.height
  const srcCtx = srcCanvas.getContext('2d')
  if (!srcCtx) throw new Error('brak kontekstu 2d')
  srcCtx.drawImage(img, 0, 0)
  const [r, g, b, a] = srcCtx.getImageData(4, 4, 1, 1).data

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('brak kontekstu 2d')
  ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, (width - img.width) / 2, (height - img.height) / 2)

  return canvas.toDataURL('image/png')
}

export interface DownloadOptions {
  formatKey: string
  orientation: Orientation
  fileType: FileType
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
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// Rasteryzuje węzeł plakatu (w rozmiarze układu `orientation`) do canvasu
// o dokładnych wymiarach papieru w px. Za duży canvas przeglądarka oddaje
// pusty (przezroczysty) - plakat jest nieprzezroczysty, więc alfa 0 w rogu
// oznacza porażkę i rzucamy, żeby drabinka zeszła na niższe dpi.
async function rasterise(node: HTMLElement, orientation: Orientation, px: { width: number; height: number }): Promise<HTMLCanvasElement> {
  const layout = SHAPE_SIZE[orientation]
  const canvas = await toCanvas(node, {
    width: layout.width,
    height: layout.height,
    canvasWidth: px.width,
    canvasHeight: px.height,
    pixelRatio: 1,
    skipAutoScale: true,
  })
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('brak kontekstu 2d')
  if (canvas.width !== px.width || canvas.height !== px.height) throw new Error('canvas ma inny rozmiar niż żądany')
  if (ctx.getImageData(4, 4, 1, 1).data[3] === 0) throw new Error('pusty canvas')
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
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('brak kontekstu 2d')
  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const imageData = await deflate(rgbaToCmyk(rgba))
  const page = pageSizePt(paper, orientation)
  const pdf = buildPdf({ widthPx: canvas.width, heightPx: canvas.height, widthPt: page.width, heightPt: page.height, imageData })
  return new Blob([pdf], { type: 'application/pdf' })
}

// Pobiera plakat w wybranym formacie. Formaty social (kwadrat/story) to
// zawsze PNG z układu 1080×1080 - `orientation`/`fileType` są ignorowane.
// Formaty papierowe idą przez drabinkę dpi; zwracane `dpi` to rozdzielczość,
// która faktycznie się udała.
export async function downloadPoster(node: HTMLElement, basename: string, opts: DownloadOptions): Promise<{ dpi?: number }> {
  const format = EXPORT_FORMATS[opts.formatKey] ?? EXPORT_FORMATS.square
  const paper = format.paper

  if (!paper) {
    const posterDataUrl = await toPng(node, { width: 1080, height: 1080, pixelRatio: 1 })
    const dataUrl = await compositeOnCanvas(posterDataUrl, format.width ?? 1080, format.height ?? 1080)
    saveAs(dataUrl, `${basename}.png`)
    return {}
  }

  const { dpi, result: blob } = await withDpiLadder(DPI_LADDER, async (d) => {
    const canvas = await rasterise(node, opts.orientation, pixelSize(paper, opts.orientation, d))
    return opts.fileType === 'pdf' ? canvasToPdfBlob(canvas, paper, opts.orientation) : canvasToPngBlob(canvas)
  })
  saveBlob(blob, `${basename}.${opts.fileType}`)
  return { dpi }
}
