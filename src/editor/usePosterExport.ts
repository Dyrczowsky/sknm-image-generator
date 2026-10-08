import { useState } from 'react'
import type { FileType, Medium, Orientation } from '../types'
import { downloadPoster } from '../posters/export'
import { DEFAULT_EXPORT_SETTINGS, DEFAULT_FORMAT, formatsFor, isPrintFormat, normalizeExportSettings, shapeFor } from '../posters/formats'
import type { ExportSettings } from '../posters/formats'

const FULL_PRINT_DPI = 300

// Nazwa pliku z tytułu plakatu: bez skrajnych spacji, odstępy jako `_`.
function fileBasename(title: string): string {
  return (title || 'plakat').trim().replace(/\s+/g, '_')
}

// Ustawienia eksportu i sam eksport. Ustawienia (`settings`) są częścią
// snapshotu: kopia robocza zapisuje je razem z resztą stanu i przywraca przez
// `applySettings`. Sesyjne są tylko `exporting` i `note`.
export function usePosterExport() {
  // Zakładka wyboru szablonu: grafika social/druk albo baner.
  const [medium, setMedium] = useState<Medium>(DEFAULT_EXPORT_SETTINGS.medium)
  const [format, setFormat] = useState(DEFAULT_EXPORT_SETTINGS.format)
  // Orientacja strony i typ pliku dotyczą tylko formatów papierowych (A4/A3/A2).
  const [orientation, setOrientation] = useState<Orientation>(DEFAULT_EXPORT_SETTINGS.orientation)
  const [printFileType, setPrintFileType] = useState<FileType>(DEFAULT_EXPORT_SETTINGS.fileType)
  const [exporting, setExporting] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const isPrint = isPrintFormat(format)
  const fileType: FileType = isPrint ? printFileType : 'png'
  // Do snapshotu idzie typ pliku wybrany dla druku, także gdy bieżący format
  // nie jest papierowy - po powrocie do A4/A3/A2 wybór ma wrócić.
  const settings: ExportSettings = { medium, format, orientation, fileType: printFileType }

  // Wczytuje ustawienia ze snapshotu; niespójne są naprawiane jak przy odczycie.
  const applySettings = (next: ExportSettings) => {
    const normalized = normalizeExportSettings(next)
    setMedium(normalized.medium)
    setFormat(normalized.format)
    setOrientation(normalized.orientation)
    setPrintFileType(normalized.fileType)
    setNote(null)
  }

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
    settings,
    applySettings,
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
    dismissNote: () => setNote(null),
    download,
  }
}

export type PosterExport = ReturnType<typeof usePosterExport>
