import { routeHref } from '../utils/route'
import { saveProblem } from '../workspace/syncState'
import type { SaveStatus } from '../workspace/syncState'
import { Button, buttonClass } from './ui'

const STRIP = 'm-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-b border-border bg-danger-soft px-4 py-2 text-[0.8125rem] leading-snug text-danger'

interface PageAlertsProps {
  // Komunikat kopii roboczej (odmowa otwarcia, nieudany zapis).
  notice: string | null
  onDismissNotice: () => void
  // Wynik ostatniego eksportu (błąd, uwaga o dpi, brak wpisu w historii).
  exportNote: string | null
  onDismissExportNote: () => void
  saveStatus: SaveStatus
}

// Komunikaty nad stroną POBOCZNĄ. Skróty „Pobierz" i „Zapisz" działają z każdej
// strony, a ich wynik normalnie pokazują edytor i jego pasek projektu - tam
// schowane (`inert`) razem z edytorem. Tu trafia to samo, żeby porażka akcji
// uruchomionej np. z Projektów nie wyglądała jak brak reakcji; `role="alert"`
// ogłasza ją też czytnikom ekranu.
export function PageAlerts({ notice, onDismissNotice, exportNote, onDismissExportNote, saveStatus }: PageAlertsProps) {
  const problem = saveProblem(saveStatus)
  return (
    <>
      {notice && (
        <p role="alert" className={STRIP}>
          <span>{notice}</span>
          <Button variant="ghost" onClick={onDismissNotice}>Zamknij</Button>
        </p>
      )}
      {exportNote && (
        <p role="alert" className={STRIP}>
          <span>{exportNote}</span>
          <Button variant="ghost" onClick={onDismissExportNote}>Zamknij</Button>
        </p>
      )}
      {problem && (
        <p role="alert" className={STRIP}>
          <span>{problem}</span>
          <a href={routeHref('editor')} className={buttonClass({ variant: 'ghost' })}>Przejdź do edytora</a>
        </p>
      )}
    </>
  )
}
