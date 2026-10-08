import { posterRegistry } from '../posters/registry'
import { ACCENT_LABELS, SCHEME_LABELS } from '../posters/schemes'
import { decodeScheme } from '../utils/colorScheme'
import { formatTimestamp } from '../utils/formatDate'
import { parseSnapshot, snapshotFromLegacyHistory } from '../snapshot/snapshot'
import { CARD_GRID, THUMB_BOX, THUMB_FIELD, cardClass } from './cardStyles'
import { EmptyNote } from './cards'
import { SnapshotThumb } from './SnapshotThumb'
import { Button, ConfirmButton } from './ui'
import type { HistoryEntry, PosterLang } from '../types'

const KNOWN_LAYOUTS = Object.keys(posterRegistry)

interface HistoryListProps {
  entries: HistoryEntry[]
  onRestore: (entry: HistoryEntry) => void
  onDelete: (id: number) => void
  lang?: PosterLang
}

interface HistoryCardProps extends Omit<HistoryListProps, 'entries'> {
  entry: HistoryEntry
}

function HistoryCard({ entry, onRestore, onDelete, lang = 'pl' }: HistoryCardProps) {
  const poster = posterRegistry[entry.poster_key]
  const { scheme, accent } = decodeScheme(entry.color_scheme)
  // Stary wpis (snapshot null) albo nieczytelny snapshot: miniatura z wąskich kolumn.
  const parsed = parseSnapshot(entry.snapshot, KNOWN_LAYOUTS)
  const snapshot = parsed.ok ? parsed.snapshot : snapshotFromLegacyHistory(entry, lang)
  const when = [entry.event_date, entry.event_time, entry.location].filter(Boolean).join(' • ')
  const look = `${poster?.name ?? entry.poster_key}${scheme ? ` · ${SCHEME_LABELS[scheme] ?? scheme}${accent ? ` / ${ACCENT_LABELS[accent]}` : ''}` : ''}`

  return (
    <li className={cardClass()}>
      {/* Duplikuje przycisk „Przywróć" poniżej, więc poza kolejką klawiatury. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Przywróć: ${entry.title || 'wpis bez tytułu'}`}
        className={`${THUMB_FIELD} cursor-pointer border-0 transition-colors hover:bg-fg/[0.06]`}
        onClick={() => onRestore(entry)}
      >
        <span className="overflow-hidden rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
          <SnapshotThumb snapshot={snapshot} box={THUMB_BOX} />
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex min-w-0 flex-col gap-1">
          <strong className="truncate text-[0.9375rem]" title={entry.title}>{entry.title || '(bez tytułu)'}</strong>
          {when && <span className="truncate">{when}</span>}
          <span className="truncate text-[0.8125rem] text-muted">{look}</span>
          <span className="truncate text-[0.8125rem] text-muted">{formatTimestamp(entry.created_at)}</span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <Button variant="outline" icon="restore" className="flex-1" onClick={() => onRestore(entry)}>Przywróć</Button>
          <ConfirmButton icon="trash" question="Usunąć wpis dla całego zespołu?" onConfirm={() => onDelete(entry.id)}>
            Usuń
          </ConfirmButton>
        </div>
      </div>
    </li>
  )
}

// Wspólna historia wygenerowanych plakatów. Każdy wpis niesie pełny snapshot
// edytora; stare wpisy (snapshot null) znają tylko pola tekstowe, layout i kolory.
// Przywrócenie otwiera wpis jako nową, niezapisaną pracę (patrz App.tsx). Wpis
// z layoutem, którego ta wersja aplikacji nie zna, dostaje szarą miniaturę
// i surowy klucz layoutu. Historia jest wspólna, więc usunięcie pyta o zgodę.
export function HistoryList({ entries, onRestore, onDelete, lang = 'pl' }: HistoryListProps) {
  if (entries.length === 0) {
    return <EmptyNote>Brak wygenerowanych obrazów. Wpis pojawia się tu po każdym pobraniu plakatu.</EmptyNote>
  }

  return (
    <ul className={CARD_GRID}>
      {entries.map((entry) => (
        <HistoryCard key={entry.id} entry={entry} onRestore={onRestore} onDelete={onDelete} lang={lang} />
      ))}
    </ul>
  )
}
