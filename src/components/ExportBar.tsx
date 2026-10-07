import type { PosterExport } from '../editor/usePosterExport'
import { SegmentedToggle } from './SegmentedToggle'

const ORIENTATION_OPTIONS = [
  { value: 'portrait', label: 'Pion' },
  { value: 'landscape', label: 'Poziom' },
] as const

const FILE_TYPE_OPTIONS = [
  { value: 'png', label: 'PNG' },
  { value: 'pdf', label: 'PDF' },
] as const

interface ExportBarProps {
  exporter: PosterExport
  onDownload: () => void
  className?: string
}

// Pasek eksportu: format, (dla papieru) orientacja i typ pliku, przycisk
// pobierania oraz komunikat o wyniku ostatniego eksportu.
export function ExportBar({ exporter, onDownload, className }: ExportBarProps) {
  return (
    <section className={className}>
      <select
        className="rounded-lg border border-field-border bg-field px-3.5 py-[11px] text-[0.9rem] text-fg"
        value={exporter.format}
        onChange={(e) => exporter.selectFormat(e.target.value)}
        aria-label="Format eksportu"
      >
        {exporter.formats.map(([key, format]) => (
          <option key={key} value={key}>
            {format.label}
          </option>
        ))}
      </select>
      {exporter.isPrint && (
        <>
          <SegmentedToggle value={exporter.orientation} onChange={exporter.setOrientation} options={ORIENTATION_OPTIONS} ariaLabel="Orientacja" />
          <SegmentedToggle value={exporter.fileType} onChange={exporter.setFileType} options={FILE_TYPE_OPTIONS} ariaLabel="Typ pliku" />
        </>
      )}
      <button
        type="button"
        className="cursor-pointer rounded-lg bg-accent px-[18px] py-[11px] text-[0.95rem] font-medium text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        onClick={onDownload}
        disabled={exporter.exporting}
      >
        {exporter.exporting ? 'Generowanie…' : `Pobierz ${exporter.fileType.toUpperCase()}`}
      </button>
      {exporter.note && (
        <p className="basis-full text-[0.85rem] text-muted" role="status">
          {exporter.note}
        </p>
      )}
    </section>
  )
}
