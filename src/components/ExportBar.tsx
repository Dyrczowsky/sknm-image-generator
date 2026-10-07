import type { PosterExport } from '../editor/usePosterExport'
import { SegmentedToggle } from './SegmentedToggle'
import { Button, Select } from './ui'
import type { ControlSize } from './ui'

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
  className?: string
}

// Pasek nad podglądem: format i - dla papieru - orientacja oraz typ pliku,
// czyli wszystko, co zmienia kształt podglądu pod spodem. Przycisk pobierania
// jest osobno (`DownloadButton`), w pasku projektu.
export function ExportBar({ exporter, className }: ExportBarProps) {
  return (
    <div role="group" aria-label="Ustawienia eksportu" className={`flex flex-wrap items-center gap-2${className ? ` ${className}` : ''}`}>
      <Select
        size="sm"
        className="w-full max-w-full min-[480px]:w-auto"
        value={exporter.format}
        onChange={(e) => exporter.selectFormat(e.target.value)}
        aria-label="Format eksportu"
      >
        {exporter.formats.map(([key, format]) => (
          <option key={key} value={key}>
            {format.label}
          </option>
        ))}
      </Select>
      {exporter.isPrint && (
        <>
          <SegmentedToggle value={exporter.orientation} onChange={exporter.setOrientation} options={ORIENTATION_OPTIONS} ariaLabel="Orientacja" />
          <SegmentedToggle value={exporter.fileType} onChange={exporter.setFileType} options={FILE_TYPE_OPTIONS} ariaLabel="Typ pliku" />
        </>
      )}
    </div>
  )
}

interface DownloadButtonProps {
  exporter: PosterExport
  onDownload: () => void
  size?: ControlSize
  className?: string
}

// „Pobierz" - jedyna akcja `primary` edytora. W trakcie generowania pokazuje
// kręciołek i pomija kolejne kliknięcia.
export function DownloadButton({ exporter, onDownload, size = 'md', className }: DownloadButtonProps) {
  return (
    <Button variant="primary" size={size} icon="download" busy={exporter.exporting} busyLabel="Generowanie…" className={className} onClick={onDownload}>
      Pobierz {exporter.fileType.toUpperCase()}
    </Button>
  )
}
