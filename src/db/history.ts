import type { Database } from 'sql.js'
import type { HistoryRow } from '../types'
import { rowsFromExec } from './utils'
import { persist } from './client'

export function listHistory(db: Database): HistoryRow[] {
  const result = db.exec(`
    SELECT g.id, g.title, g.subtitle, g.speaker, g.event_date, g.event_time, g.location,
           g.color_scheme, g.created_at, g.template_id, t.name AS template_name, t.poster_key AS template_poster_key
    FROM generated_images g
    LEFT JOIN templates t ON t.id = g.template_id
    ORDER BY g.created_at DESC, g.id DESC
  `)
  return rowsFromExec<HistoryRow>(result)
}

export async function addHistoryEntry(
  db: Database,
  entry: Partial<Pick<HistoryRow, 'title' | 'subtitle' | 'speaker' | 'event_date' | 'event_time' | 'location' | 'color_scheme' | 'template_id'>>
): Promise<void> {
  db.run(
    `INSERT INTO generated_images
       (template_id, title, subtitle, speaker, event_date, event_time, location, color_scheme)
     VALUES (:template_id, :title, :subtitle, :speaker, :event_date, :event_time, :location, :color_scheme)`,
    {
      ':template_id': entry.template_id ?? null,
      ':title': entry.title ?? '',
      ':subtitle': entry.subtitle ?? '',
      ':speaker': entry.speaker ?? '',
      ':event_date': entry.event_date ?? '',
      ':event_time': entry.event_time ?? '',
      ':location': entry.location ?? '',
      ':color_scheme': entry.color_scheme ?? null,
    }
  )
  await persist(db)
}

export async function deleteHistoryEntry(db: Database, id: number): Promise<void> {
  db.run('DELETE FROM generated_images WHERE id = :id', { ':id': id })
  await persist(db)
}
