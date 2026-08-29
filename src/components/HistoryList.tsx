import { posterRegistry } from '../posters/registry'
import { SCHEME_LABELS } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'
import type { HistoryRow } from '../types'

const THUMB_SIZE = 120

interface HistoryListProps {
  entries: HistoryRow[]
  onRestore: (entry: HistoryRow) => void
  onDelete: (id: number) => void
}

export function HistoryList({ entries, onRestore, onDelete }: HistoryListProps) {
  if (entries.length === 0) {
    return <p className="text-muted">Brak wygenerowanych obrazów.</p>
  }

  const actionButton =
    'cursor-pointer rounded-lg border border-field-border bg-transparent px-3 py-[7px] text-[0.8rem] text-fg transition-[border-color,color]'

  return (
    <ul className="flex list-none flex-col gap-2.5 p-0">
      {entries.map((entry) => {
        const poster = entry.template_poster_key ? posterRegistry[entry.template_poster_key] : null
        const Component = poster?.Component

        return (
          <li
            key={entry.id}
            className="flex items-center gap-3.5 rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-[0.9rem]"
          >
            <div className="flex-none overflow-hidden rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
              {Component ? (
                <PosterScaled size={THUMB_SIZE}>
                  <Component data={entry} scheme={entry.color_scheme ?? undefined} />
                </PosterScaled>
              ) : (
                <div className="bg-border" style={{ width: THUMB_SIZE, height: THUMB_SIZE }} />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className="truncate">{entry.title || '(bez tytułu)'}</strong>
              <span className="truncate">{[entry.event_date, entry.event_time, entry.location].filter(Boolean).join(' • ')}</span>
              <span className="truncate text-[0.8rem] text-muted">
                {entry.template_name ?? 'usunięty szablon'}
                {entry.color_scheme && ` · ${SCHEME_LABELS[entry.color_scheme] ?? entry.color_scheme}`}
                {' — '}{entry.created_at}
              </span>
            </div>

            <div className="flex flex-none gap-2">
              <button type="button" className={`${actionButton} hover:border-accent hover:text-accent`} onClick={() => onRestore(entry)}>
                Przywróć
              </button>
              <button type="button" className={`${actionButton} hover:border-danger hover:text-danger`} onClick={() => onDelete(entry.id)}>
                Usuń
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
