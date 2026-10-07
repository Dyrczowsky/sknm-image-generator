import type { Medium, Orientation, PosterShape } from '../types'

export interface PaperSize {
  widthMm: number
  heightMm: number
}

interface FormatBase {
  label: string
  // Zakładka wyboru szablonu, w której format jest dostępny.
  medium: Medium
}

// Format o stałym rozmiarze w px. Bez `shape` to format social: układ
// kwadratowy, a wyższy format (Story) dostaje dostawkę tła. Z `shape` to
// baner: układ tego kształtu rasteryzowany wprost do rozmiaru formatu.
export interface PixelFormat extends FormatBase {
  width: number
  height: number
  shape?: PosterShape
  paper?: undefined
}

// Format papierowy (`paper` w mm, w pionie): układ idzie za orientacją,
// a rozmiar w px za dpi.
export interface PaperFormat extends FormatBase {
  paper: PaperSize
  width?: undefined
  height?: undefined
  shape?: undefined
}

export type ExportFormat = PixelFormat | PaperFormat

export const EXPORT_FORMATS: Record<string, ExportFormat> = {
  square: { label: 'Kwadrat · 1080×1080', medium: 'social', width: 1080, height: 1080 },
  story: { label: 'Story · 1080×1920', medium: 'social', width: 1080, height: 1920 },
  a4: { label: 'A4 · 210×297 mm', medium: 'social', paper: { widthMm: 210, heightMm: 297 } },
  a3: { label: 'A3 · 297×420 mm', medium: 'social', paper: { widthMm: 297, heightMm: 420 } },
  a2: { label: 'A2 · 420×594 mm', medium: 'social', paper: { widthMm: 420, heightMm: 594 } },
  fbCover: { label: 'Facebook · okładka strony · 1640×624', medium: 'banner', width: 1640, height: 624, shape: 'cover' },
  fbEvent: { label: 'Facebook · wydarzenie · 1920×1005', medium: 'banner', width: 1920, height: 1005, shape: 'event' },
}

// Format wybierany po przejściu na daną zakładkę.
export const DEFAULT_FORMAT: Record<Medium, string> = { social: 'square', banner: 'fbCover' }

export function formatsFor(medium: Medium): [string, ExportFormat][] {
  return Object.entries(EXPORT_FORMATS).filter(([, format]) => format.medium === medium)
}

export function isPrintFormat(formatKey: string): boolean {
  return Boolean(EXPORT_FORMATS[formatKey]?.paper)
}

export function shapeFor(formatKey: string, orientation: Orientation): PosterShape {
  return EXPORT_FORMATS[formatKey]?.shape ?? (isPrintFormat(formatKey) ? orientation : 'square')
}

function oriented(paper: PaperSize, orientation: Orientation): { w: number; h: number } {
  return orientation === 'landscape'
    ? { w: paper.heightMm, h: paper.widthMm }
    : { w: paper.widthMm, h: paper.heightMm }
}

// Rozmiar w pikselach przy danym dpi (25,4 mm = 1 cal).
export function pixelSize(paper: PaperSize, orientation: Orientation, dpi: number): { width: number; height: number } {
  const { w, h } = oriented(paper, orientation)
  return { width: Math.round((w / 25.4) * dpi), height: Math.round((h / 25.4) * dpi) }
}

// Rozmiar strony PDF w punktach (1 pt = 1/72 cala).
export function pageSizePt(paper: PaperSize, orientation: Orientation): { width: number; height: number } {
  const { w, h } = oriented(paper, orientation)
  return { width: (w * 72) / 25.4, height: (h * 72) / 25.4 }
}
