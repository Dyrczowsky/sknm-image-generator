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
    return <p className="history-empty">Brak wygenerowanych obrazów.</p>
  }

  return (
    <ul className="history-list">
      {entries.map((entry) => {
        const poster = entry.template_poster_key ? posterRegistry[entry.template_poster_key] : null
        const Component = poster?.Component

        return (
          <li key={entry.id} className="history-item">
            <div className="history-thumb">
              {Component ? (
                <PosterScaled size={THUMB_SIZE}>
                  <Component data={entry} scheme={entry.color_scheme ?? undefined} />
                </PosterScaled>
              ) : (
                <div className="history-thumb-empty" style={{ width: THUMB_SIZE, height: THUMB_SIZE }} />
              )}
            </div>

            <div className="history-info">
              <strong>{entry.title || '(bez tytułu)'}</strong>
              <span>{[entry.event_date, entry.event_time, entry.location].filter(Boolean).join(' • ')}</span>
              <span className="history-meta">
                {entry.template_name ?? 'usunięty szablon'}
                {entry.color_scheme && ` · ${SCHEME_LABELS[entry.color_scheme] ?? entry.color_scheme}`}
                {' — '}{entry.created_at}
              </span>
            </div>

            <div className="history-actions">
              <button type="button" onClick={() => onRestore(entry)}>
                Przywróć
              </button>
              <button type="button" className="history-delete" onClick={() => onDelete(entry.id)}>
                Usuń
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
