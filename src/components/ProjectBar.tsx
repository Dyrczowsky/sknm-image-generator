import type { SaveStatus } from '../workspace/syncState'
import { ROW_ACTION } from './styles'

interface ProjectBarProps {
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
}

const ACTION = `${ROW_ACTION} hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60`
const DANGER_ACTION = `${ROW_ACTION} hover:border-danger hover:text-danger`
const NOTE = 'mt-2.5 flex flex-wrap items-center gap-2.5 text-[0.85rem]'

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

function missingLabel(count: number): string {
  if (count === 1) return 'Nie udało się wczytać 1 grafiki.'
  return `Nie udało się wczytać ${count} grafik.`
}

// Pasek pod nagłówkiem: co jest otwarte, czy jest zapisane, „Zapisz" i „Nowy
// projekt". Tu też lądują komunikaty kopii roboczej, wybór przy konflikcie
// wersji i informacja o grafikach, których nie udało się wczytać.
export function ProjectBar({
  name, status, cloud, notice, missingCount,
  onSave, onNew, onDismissNotice, onRetryMissing, onDropMissing, onLoadCloud, onOverwrite,
}: ProjectBarProps) {
  const conflict = status === 'conflict'
  return (
    <section className="mb-2 rounded-[14px] border border-border bg-surface px-5 py-3.5" aria-label="Projekt">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <strong className="min-w-0 max-w-full truncate text-[0.95rem]">{name ?? 'Wersja robocza'}</strong>
        <span className={`text-[0.85rem] ${status === 'error' || conflict ? 'text-danger' : 'text-muted'}`} role="status">
          {statusLabel(status, cloud)}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {conflict && (
            <>
              <button type="button" className={ACTION} onClick={onLoadCloud}>Wczytaj wersję z chmury</button>
              <button type="button" className={DANGER_ACTION} onClick={onOverwrite}>Nadpisz</button>
            </>
          )}
          {cloud && !conflict && (
            <button type="button" className={ACTION} onClick={onSave} disabled={status === 'saving'}>Zapisz</button>
          )}
          <button type="button" className={ACTION} onClick={onNew}>Nowy projekt</button>
        </div>
      </div>

      {notice && (
        <p className={`${NOTE} text-danger`} role="alert">
          <span>{notice}</span>
          <button type="button" className={ROW_ACTION} onClick={onDismissNotice}>Zamknij</button>
        </p>
      )}

      {missingCount > 0 && (
        <p className={`${NOTE} text-muted`} role="alert">
          <span>{missingLabel(missingCount)} Zostają w projekcie i wrócą, gdy uda się je pobrać.</span>
          <button type="button" className={ACTION} onClick={onRetryMissing}>Spróbuj ponownie</button>
          <button type="button" className={DANGER_ACTION} onClick={onDropMissing}>Usuń je z projektu</button>
        </p>
      )}
    </section>
  )
}
