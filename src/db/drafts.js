import { rowsFromExec } from './utils'
import { persist } from './client'

export function getDraft(db) {
  const result = db.exec('SELECT * FROM draft WHERE id = 1')
  const rows = rowsFromExec(result)
  return rows[0] ?? null
}

export async function saveDraft(db, draft) {
  db.run(
    `INSERT INTO draft (id, title, subtitle, speaker, event_date, event_time, location, template_id, updated_at)
     VALUES (1, :title, :subtitle, :speaker, :event_date, :event_time, :location, :template_id, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       subtitle = excluded.subtitle,
       speaker = excluded.speaker,
       event_date = excluded.event_date,
       event_time = excluded.event_time,
       location = excluded.location,
       template_id = excluded.template_id,
       updated_at = excluded.updated_at`,
    {
      ':title': draft.title ?? '',
      ':subtitle': draft.subtitle ?? '',
      ':speaker': draft.speaker ?? '',
      ':event_date': draft.event_date ?? '',
      ':event_time': draft.event_time ?? '',
      ':location': draft.location ?? '',
      ':template_id': draft.template_id ?? null,
    }
  )
  await persist(db)
}
