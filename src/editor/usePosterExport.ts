import { useState } from 'react'
import type { FileType, Medium, Orientation } from '../types'
import { downloadPoster } from '../posters/export'
import { DEFAULT_FORMAT, formatsFor, isPrintFormat, shapeFor } from '../posters/formats'

const FULL_PRINT_DPI = 300

// Nazwa pliku z tytułu plakatu: bez skrajnych spacji, odstępy jako `_`.
function fileBasename(title: string): string {
  return (title || 'plakat').trim().replace(/\s+/g, '_')
}

// Ustawienia eksportu i sam eksport. Wszystko tu jest sesyjne - po
// odświeżeniu strony wraca „Social media" i kwadrat.
export function usePosterExport() {
  // Zakładka wyboru szablonu: grafika social/druk albo baner.
  const [medium, setMedium] = useState<Medium>('social')
  const [format, setFormat] = useState(DEFAULT_FORMAT.social)
  // Orientacja strony i typ pliku dotyczą tylko formatów papierowych (A4/A3/A2).
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [printFileType, setPrintFileType] = useState<FileType>('png')
  const [exporting, setExporting] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const isPrint = isPrintFormat(format)
  const fileType: FileType = isPrint ? printFileType : 'png'

  // Zmiana zakładki zostawia szablon, dane i kolorystykę - zmienia się tylko
  // komponent (plakat/baner) i lista formatów eksportu.
  const selectMedium = (next: Medium) => {
    if (next === medium) return
    setMedium(next)
    setFormat(DEFAULT_FORMAT[next])
    setNote(null)
  }

  const selectFormat = (key: string) => {
    setFormat(key)
    setNote(null)
  }

  // Pobiera plakat z węzła `node`. Po udanym zapisie pliku woła `onSaved`
  // (dopisanie do historii); jego porażka nie unieważnia pobranego pliku.
  const download = async (node: HTMLElement, title: string, onSaved?: () => Promise<void>) => {
    if (exporting) return
    setExporting(true)
    setNote(null)
    try {
      const { dpi } = await downloadPoster(node, fileBasename(title), { formatKey: format, orientation, fileType })
      const notes = [dpi !== undefined && dpi < FULL_PRINT_DPI && `Zapisano w ${dpi} dpi — przeglądarka nie obsłużyła ${FULL_PRINT_DPI} dpi.`]
      try {
        await onSaved?.()
      } catch {
        notes.push('Plik zapisany, ale nie udało się dopisać wpisu do historii.')
      }
      setNote(notes.filter(Boolean).join(' ') || null)
    } catch {
      setNote('Nie udało się wygenerować pliku. Spróbuj mniejszego formatu.')
    } finally {
      setExporting(false)
    }
  }

  return {
    medium,
    selectMedium,
    formats: formatsFor(medium),
    format,
    selectFormat,
    isPrint,
    orientation,
    setOrientation,
    fileType,
    setFileType: setPrintFileType,
    shape: shapeFor(format, orientation),
    exporting,
    note,
    download,
  }
}

export type PosterExport = ReturnType<typeof usePosterExport>
