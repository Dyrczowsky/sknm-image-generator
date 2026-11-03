import { toCanvas } from 'html-to-image'
import { canvasToPngBlob, context2d, deflate, saveBlob } from '../../posters/export'
import { buildPdfPages } from '../../posters/pdf'
import type { PdfImage } from '../../posters/pdf'
import { rgbaToRgb } from '../../posters/rgb'
import { SLIDE_SIZE } from '../shape'
import type { Deck, SlideAspect } from '../types'
import { renderOffscreen } from './offscreen'

export type ExportProgress = (done: number, total: number) => void

// Przeglądarki potrafią zablokować serię pobrań naraz - dajemy im chwilę.
const DOWNLOAD_GAP_MS = 250

const RASTER: Record<SlideAspect, { width: number; height: number; widthPt: number; heightPt: number }> = {
  '16:9': { width: 1920, height: 1080, widthPt: 1440, heightPt: 810 },
  '1:1': { width: 1080, height: 1080, widthPt: 810, heightPt: 810 },
}

// Rozmiar obrazu eksportu (px) i strony PDF (pt) dla proporcji slajdu.
export function rasterSize(aspect: SlideAspect) {
  return { ...RASTER[aspect] }
}

// Nazwa pliku z nazwy prezentacji: polskie litery zostają, znaki zakazane
// w nazwach plików i sterujące zamieniamy na '_'.
export function deckFileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  const safe = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().replace(/^\.+/, '').trim()
  return safe || 'prezentacja'
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// WebKit przy pierwszym renderze często pomija obrazy i fonty z osadzonych
// danych, więc rysujemy dwa razy i bierzemy drugi wynik.
async function rendered(draw: () => Promise<HTMLCanvasElement>): Promise<HTMLCanvasElement> {
  await draw()
  return draw()
}

function rasteriseSlide(node: HTMLElement, aspect: SlideAspect): Promise<HTMLCanvasElement> {
  const layout = SLIDE_SIZE[aspect]
  const target = RASTER[aspect]
  return rendered(() =>
    toCanvas(node, { width: layout.width, height: layout.height, pixelRatio: target.width / layout.width }),
  )
}

// Rasteryzuje slajdy po kolei (oszczędza pamięć) i oddaje każdy płótnem.
async function forEachSlide(
  deck: Deck,
  aspect: SlideAspect,
  onProgress: ExportProgress | undefined,
  handle: (canvas: HTMLCanvasElement, index: number) => Promise<void>,
): Promise<void> {
  const { nodes, dispose } = await renderOffscreen(deck, aspect)
  try {
    onProgress?.(0, nodes.length)
    for (let i = 0; i < nodes.length; i++) {
      await handle(await rasteriseSlide(nodes[i], aspect), i)
      onProgress?.(i + 1, nodes.length)
    }
  } finally {
    dispose()
  }
}

export async function exportDeckPng(deck: Deck, aspect: SlideAspect, onProgress?: ExportProgress): Promise<void> {
  const base = deckFileName(deck.name)
  const pad = Math.max(2, String(deck.slides.length).length)
  await forEachSlide(deck, aspect, onProgress, async (canvas, i) => {
    if (i > 0) await wait(DOWNLOAD_GAP_MS)
    saveBlob(await canvasToPngBlob(canvas), `${base}-${String(i + 1).padStart(pad, '0')}.png`)
  })
}

export async function exportDeckPdf(deck: Deck, aspect: SlideAspect, onProgress?: ExportProgress): Promise<void> {
  const { widthPt, heightPt } = RASTER[aspect]
  const pages: PdfImage[] = []
  await forEachSlide(deck, aspect, onProgress, async (canvas) => {
    const rgba = context2d(canvas).getImageData(0, 0, canvas.width, canvas.height).data
    const imageData = await deflate(rgbaToRgb(rgba))
    pages.push({ widthPx: canvas.width, heightPx: canvas.height, widthPt, heightPt, imageData })
  })
  saveBlob(new Blob([buildPdfPages(pages)], { type: 'application/pdf' }), `${deckFileName(deck.name)}.pdf`)
}
