export function HistoryList({ entries }) {
  if (entries.length === 0) {
    return <p className="history-empty">Brak wygenerowanych obrazów.</p>
  }

  return (
    <ul className="history-list">
      {entries.map((entry) => (
        <li key={entry.id} className="history-item">
          <strong>{entry.title || '(bez tytułu)'}</strong>
          <span>{[entry.event_date, entry.event_time, entry.location].filter(Boolean).join(' • ')}</span>
          <span className="history-meta">
            {entry.template_name} — {entry.created_at}
          </span>
        </li>
      ))}
    </ul>
  )
}
