import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { PROJECT_NAME_MAX } from '../projects/remoteProjects'
import type { SaveStatus } from '../workspace/syncState'
import { Button, Icon, IconButton, Input } from './ui'
import type { IconName } from './ui'

export interface ProjectBarProps {
  // Identyfikator otwartego projektu; `null` = wersja robocza. Zmiana
  // identyfikatora zeruje stan paska (np. rozpoczętą zmianę nazwy).
  id: number | null
  // Nazwa otwartego projektu; `null` = wersja robocza bez projektu.
  name: string | null
  status: SaveStatus
  // Czy aplikacja ma chmurę (Supabase). Bez niej nie ma czego zapisywać.
  cloud: boolean
  // Komunikat kopii roboczej (odmowa otwarcia, nieudany zapis).
  notice: string | null
  // Ile grafik projektu nie udało się wczytać.
  missingCount: number
  onSave: () => void
  onNew: () => void
  onDismissNotice: () => void
  onRetryMissing: () => void
  onDropMissing: () => void
  onLoadCloud: () => void
  onOverwrite: () => void
  // Zmiana nazwy otwartego projektu w miejscu. Bez tego propsa (wersja
  // robocza, cudzy projekt) nazwy nie da się edytować.
  onRename?: (name: string) => void
  // Główna akcja edytora („Pobierz") - po prawej, zawsze widoczna.
  action?: ReactNode
}

// Opis stanu zapisu obok nazwy projektu.
function statusLabel(status: SaveStatus, cloud: boolean): string {
  switch (status) {
    case 'local':
      return cloud ? 'Zapisana tylko na tym urządzeniu' : 'Zapisywana na tym urządzeniu'
    case 'saved':
      return 'Zapisano'
    case 'dirty':
      return 'Niezapisane zmiany'
    case 'saving':
      return 'Zapisywanie…'
    case 'error':
      return 'Nie udało się zapisać — ponowimy próbę'
    case 'conflict':
      return 'Projekt został zmieniony w innym miejscu'
    case 'paused':
      return 'Autozapis wstrzymany — zaloguj się jako właściciel projektu'
  }
}

// Stan zapisu ma ikonę i tekst - kolor tylko je wzmacnia.
const STATUS_ICON: Record<SaveStatus, IconName> = {
  local: 'local',
  saved: 'saved',
  dirty: 'unsaved',
  saving: 'saving',
  error: 'saveError',
  conflict: 'conflict',
  paused: 'paused',
}
const STATUS_TONE: Record<SaveStatus, string> = {
  local: 'text-muted',
  saved: 'text-muted',
  dirty: 'text-muted',
  saving: 'text-muted',
  error: 'text-danger',
  conflict: 'text-danger',
  paused: 'text-warning',
}
const STATUS_ICON_TONE: Partial<Record<SaveStatus, string>> = { saved: 'text-success', dirty: 'text-warning', saving: 'animate-spin' }

function missingLabel(count: number): string {
  if (count === 1) return 'Nie udało się wczytać 1 grafiki.'
  return `Nie udało się wczytać ${count} grafik.`
}

const NOTE = 'm-0 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border px-4 py-2 text-[0.8125rem] leading-snug'

// Pasek projektu nad edytorem: co jest otwarte, czy jest zapisane, „Zapisz",
// „Nowy projekt" i główna akcja („Pobierz"). Tu też lądują komunikaty kopii
// roboczej, wybór przy konflikcie wersji i informacja o grafikach, których nie
// udało się wczytać.
export function ProjectBar(props: ProjectBarProps) {
  // Pasek jest stale zamontowany, więc jego stan lokalny przeżywa otwarcie innego
  // projektu: `key` zaczyna go od nowa, żeby szkic nazwy projektu A nie zmienił B.
  return <ProjectStrip key={props.id ?? 'draft'} {...props} />
}

function ProjectStrip({
  name, status, cloud, notice, missingCount,
  onSave, onNew, onDismissNotice, onRetryMissing, onDropMissing, onLoadCloud, onOverwrite, onRename, action,
}: ProjectBarProps) {
  const conflict = status === 'conflict'
  // `null` = nazwa nie jest edytowana.
  const [draft, setDraft] = useState<string | null>(null)
  const renaming = draft !== null && name !== null && Boolean(onRename)

  const rename = (e: FormEvent) => {
    e.preventDefault()
    const next = draft?.trim()
    if (!next) return
    if (next !== name) onRename?.(next)
    setDraft(null)
  }

  return (
    <section className="flex-none border-b border-border bg-bg" aria-label="Projekt">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 min-[900px]:min-h-14">
        <div className="flex min-w-0 flex-1 basis-full items-center gap-x-3 gap-y-1 max-[900px]:flex-wrap min-[900px]:basis-0">
          {renaming ? (
            <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={rename}>
              <Input
                size="sm"
                className="min-w-0 flex-1 min-[900px]:max-w-80"
                value={draft}
                maxLength={PROJECT_NAME_MAX}
                autoFocus
                aria-label="Nazwa projektu"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setDraft(null)
                }}
              />
              <Button type="submit" disabled={!draft?.trim()}>Zmień</Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>Anuluj</Button>
            </form>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-1">
                <strong className="min-w-0 truncate text-[0.9375rem] leading-tight">{name ?? 'Wersja robocza'}</strong>
                {name !== null && onRename && <IconButton icon="pencil" label="Zmień nazwę projektu" onClick={() => setDraft(name)} />}
              </div>
              <span className={`flex min-w-0 items-center gap-1.5 text-[0.8125rem] leading-tight ${STATUS_TONE[status]}`} title={statusLabel(status, cloud)}>
                <Icon name={STATUS_ICON[status]} className={STATUS_ICON_TONE[status]} />
                <span className="truncate" role="status">{statusLabel(status, cloud)}</span>
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {conflict && (
            <>
              <Button onClick={onLoadCloud}>Wczytaj wersję z chmury</Button>
              <Button variant="danger" onClick={onOverwrite}>Nadpisz</Button>
            </>
          )}
          {cloud && !conflict && (
            <Button icon="save" busy={status === 'saving'} onClick={onSave}>Zapisz</Button>
          )}
          <Button variant="ghost" icon="newProject" onClick={onNew}>Nowy projekt</Button>
          {action}
        </div>
      </div>

      {notice && (
        <p className={`${NOTE} text-danger`} role="alert">
          <span>{notice}</span>
          <Button variant="ghost" onClick={onDismissNotice}>Zamknij</Button>
        </p>
      )}

      {missingCount > 0 && (
        <p className={`${NOTE} text-muted`} role="alert">
          <span>{missingLabel(missingCount)} Zostają w projekcie i wrócą, gdy uda się je pobrać.</span>
          <Button onClick={onRetryMissing}>Spróbuj ponownie</Button>
          <Button variant="danger" onClick={onDropMissing}>Usuń je z projektu</Button>
        </p>
      )}
    </section>
  )
}
