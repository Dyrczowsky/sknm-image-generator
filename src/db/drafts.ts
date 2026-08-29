import type { Database } from 'sql.js'
import type { DraftRow, FieldVisibility } from '../types'
import { rowsFromExec } from './utils'
import { persist } from './client'

// Wejście do saveDraft: pola tekstowe/meta jak w wierszu, ale `visibility`
// podajemy jako obiekt - serializacja do JSON dzieje się tutaj.
type DraftInput = Partial<Omit<DraftRow, 'visibility'>> & { visibility?: FieldVisibility }

export function getDraft(db: Database): DraftRow | null {
  const result = db.exec('SELECT * FROM draft WHERE id = 1')
  const rows = rowsFromExec<DraftRow>(result)
  return rows[0] ?? null
}

// Parsuje kolumnę draft.visibility (JSON). Zły / pusty wpis → brak ograniczeń.
export function parseVisibility(raw: string | null | undefined): FieldVisibility {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as FieldVisibility) : {}
  } catch {
    return {}
  }
}

export async function saveDraft(db: Database, draft: DraftInput): Promise<void> {
  db.run(
    `INSERT INTO draft (id, title, subtitle, speaker, event_date, event_time, location, badge, badge2, visibility, color_scheme, template_id, updated_at)
     VALUES (1, :title, :subtitle, :speaker, :event_date, :event_time, :location, :badge, :badge2, :visibility, :color_scheme, :template_id, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       subtitle = excluded.subtitle,
       speaker = excluded.speaker,
       event_date = excluded.event_date,
       event_time = excluded.event_time,
       location = excluded.location,
       badge = excluded.badge,
       badge2 = excluded.badge2,
       visibility = excluded.visibility,
       color_scheme = excluded.color_scheme,
       template_id = excluded.template_id,
       updated_at = excluded.updated_at`,
    {
      ':title': draft.title ?? '',
      ':subtitle': draft.subtitle ?? '',
      ':speaker': draft.speaker ?? '',
      ':event_date': draft.event_date ?? '',
      ':event_time': draft.event_time ?? '',
      ':location': draft.location ?? '',
      ':badge': draft.badge ?? '',
      ':badge2': draft.badge2 ?? '',
      ':visibility': JSON.stringify(draft.visibility ?? {}),
      ':color_scheme': draft.color_scheme ?? null,
      ':template_id': draft.template_id ?? null,
    }
  )
  await persist(db)
}
