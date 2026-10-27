import { useState } from 'react'
import type { Deck, SlideAspect } from '../../slides/types'
import { SegmentedToggle } from '../SegmentedToggle'
import { UI_ERROR, UI_HINT, UI_LABEL } from '../styles'
import { Button, Icon, Popover } from '../ui'
import type { IconName } from '../ui'

type Format = 'pdf' | 'png' | 'html'

interface ExportMenuProps {
  deck: Deck
}

const ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' },
] as const satisfies readonly { value: SlideAspect; label: string }[]

const FORMATS: readonly { format: Format; icon: IconName; label: string; hint: string }[] = [
  { format: 'pdf', icon: 'download', label: 'PDF', hint: 'Jeden plik, slajd na stronę.' },
  { format: 'png', icon: 'image', label: 'PNG', hint: 'Jeden plik na slajd.' },
  { format: 'html', icon: 'presentations', label: 'HTML', hint: 'Pokaz w przeglądarce, w obu formatach.' },
]

// Moduły eksportu ładujemy dopiero przy pobieraniu - html-to-image i PDF nie
// są potrzebne do edycji.
async function runExport(format: Format, deck: Deck, aspect: SlideAspect, onProgress: (done: number, total: number) => void) {
  if (format === 'html') {
    const { exportDeckHtml } = await import('../../slides/export/html')
    return exportDeckHtml(deck, onProgress)
  }
  const raster = await import('../../slides/export/raster')
  return format === 'pdf' ? raster.exportDeckPdf(deck, aspect, onProgress) : raster.exportDeckPng(deck, aspect, onProgress)
}

// „Pobierz": format slajdów i typ pliku. Postęp i błąd zostają w panelu.
export function ExportMenu({ deck }: ExportMenuProps) {
  const [aspect, setAspect] = useState<SlideAspect>(deck.viewAspect)
  const [busy, setBusy] = useState<Format | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const start = (format: Format) => {
    if (busy) return
    setBusy(format)
    setError(null)
    setProgress(null)
    void runExport(format, deck, aspect, (done, total) => setProgress({ done, total }))
      .catch(() => setError('Nie udało się przygotować pliku. Spróbuj ponownie.'))
      .finally(() => {
        setBusy(null)
        setProgress(null)
      })
  }

  const status = busy ? (progress ? `Przygotowuję slajd ${Math.min(progress.done + 1, progress.total)} z ${progress.total}…` : 'Przygotowuję…') : null

  return (
    <Popover
      label="Pobierz prezentację"
      align="end"
      open={open}
      onOpenChange={setOpen}
      trigger={(props) => (
        <Button {...props} icon="download" iconEnd="chevronDown" busy={busy !== null} busyLabel="Pobieranie…">
          Pobierz
        </Button>
      )}
      // Panel zostaje w drzewie po zamknięciu - postęp i błąd nie giną.
      keepMounted
    >
      <div className="flex w-72 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className={UI_LABEL}>Format slajdów</span>
          <SegmentedToggle value={aspect} options={ASPECT_OPTIONS} ariaLabel="Format slajdów w pliku" onChange={setAspect} />
        </div>
        <div className="flex flex-col gap-1" role="group" aria-label="Typ pliku">
          {FORMATS.map(({ format, icon, label, hint }) => (
            <Button
              key={format}
              variant="ghost"
              align="start"
              fullWidth
              icon={icon}
              disabled={busy !== null && busy !== format}
              busy={busy === format}
              className="!h-auto py-2"
              onClick={() => start(format)}
            >
              <span className="flex flex-col items-start gap-0.5 text-left">
                <span>{label}</span>
                <span className="text-[0.75rem] font-normal text-muted">{format === 'html' ? hint : `${hint} Format ${aspect}.`}</span>
              </span>
            </Button>
          ))}
        </div>
        {status && (
          <p className={UI_HINT} role="status">
            {status}
          </p>
        )}
        {error && (
          <p className={UI_ERROR} role="alert">
            <Icon name="alert" className="mt-px" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </Popover>
  )
}
