import { posterRegistry } from '../posters/registry'
import { ACCENT_LABELS, SCHEME_LABELS } from '../posters/schemes'
import { decodeScheme } from '../utils/colorScheme'
import { formatTimestamp } from '../utils/formatDate'
import { PosterScaled } from './PosterScaled'
import { ROW_ACTION } from './styles'
import type { HistoryEntry, PosterLang } from '../types'

const THUMB_SIZE = 120

interface HistoryListProps {
  entries: HistoryEntry[]
  onRestore: (entry: HistoryEntry) => void
  onDelete: (id: number) => void
  lang?: PosterLang
}

// Wspólna historia wygenerowanych plakatów. Wpis z layoutem, którego ta
// wersja aplikacji nie zna, dostaje szarą miniaturę i surowy klucz layoutu.
export function HistoryList({ entries, onRestore, onDelete, lang }: HistoryListProps) {
  if (entries.length === 0) {
    return <p className="text-muted">Brak wygenerowanych obrazów.</p>
  }

  return (
    <ul className="flex list-none flex-col gap-2.5 p-0">
      {entries.map((entry) => {
        const poster = posterRegistry[entry.poster_key]
        const Component = poster?.Component
        const { scheme, accent } = decodeScheme(entry.color_scheme)

        return (
          <li
            key={entry.id}
            className="flex items-center gap-3.5 rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-[0.9rem]"
          >
            <div className="flex-none overflow-hidden rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
              {Component ? (
                <PosterScaled size={THUMB_SIZE}>
                  <Component data={entry} scheme={scheme} accent={accent} lang={lang} />
                </PosterScaled>
              ) : (
                <div className="bg-border" style={{ width: THUMB_SIZE, height: THUMB_SIZE }} />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className="truncate">{entry.title || '(bez tytułu)'}</strong>
              <span className="truncate">{[entry.event_date, entry.event_time, entry.location].filter(Boolean).join(' • ')}</span>
              <span className="truncate text-[0.8rem] text-muted">
                {poster?.name ?? entry.poster_key}
                {scheme && ` · ${SCHEME_LABELS[scheme] ?? scheme}${accent ? ` / ${ACCENT_LABELS[accent]}` : ''}`}
                {' — '}{formatTimestamp(entry.created_at)}
              </span>
            </div>

            <div className="flex flex-none gap-2">
              <button type="button" className={`${ROW_ACTION} hover:border-accent hover:text-accent`} onClick={() => onRestore(entry)}>
                Przywróć
              </button>
              <button type="button" className={`${ROW_ACTION} hover:border-danger hover:text-danger`} onClick={() => onDelete(entry.id)}>
                Usuń
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
