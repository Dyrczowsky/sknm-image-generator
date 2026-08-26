import { rowsFromExec } from './utils'
import { persist } from './client'

export function listHistory(db) {
  const result = db.exec(`
    SELECT g.id, g.title, g.subtitle, g.speaker, g.event_date, g.event_time, g.location,
           g.created_at, g.template_id, t.name AS template_name, t.poster_key AS template_poster_key
    FROM generated_images g
    LEFT JOIN templates t ON t.id = g.template_id
    ORDER BY g.created_at DESC, g.id DESC
  `)
  return rowsFromExec(result)
}

export async function addHistoryEntry(db, entry) {
  db.run(
    `INSERT INTO generated_images
       (template_id, title, subtitle, speaker, event_date, event_time, location)
     VALUES (:template_id, :title, :subtitle, :speaker, :event_date, :event_time, :location)`,
    {
      ':template_id': entry.template_id ?? null,
      ':title': entry.title ?? '',
      ':subtitle': entry.subtitle ?? '',
      ':speaker': entry.speaker ?? '',
      ':event_date': entry.event_date ?? '',
      ':event_time': entry.event_time ?? '',
      ':location': entry.location ?? '',
    }
  )
  await persist(db)
}

export async function deleteHistoryEntry(db, id) {
  db.run('DELETE FROM generated_images WHERE id = :id', { ':id': id })
  await persist(db)
}
