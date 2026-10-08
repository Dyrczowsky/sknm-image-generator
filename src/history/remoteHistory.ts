import type { SupabaseClient } from '@supabase/supabase-js'
import type { EditorSnapshot } from '../snapshot/snapshot'
import type { HistoryEntry, NewHistoryEntry } from '../types'

const TABLE = 'sknm_poster_history'
const COLUMNS = 'id, created_at, poster_key, title, subtitle, speaker, event_date, event_time, location, color_scheme, snapshot'
export const HISTORY_LIMIT = 50

// Wpis historii dla snapshotu edytora. Wąskie kolumny (lista, starsze klienty)
// są wypełniane obok pełnego `snapshot` (sam snapshot nie zawiera obrazów -
// tylko ich nazwy, patrz src/assets/). Bez przycinania, jak dotąd: pola
// formularza mają własne limity długości, a baza odrzuca resztę.
export function newHistoryEntry(snapshot: EditorSnapshot): NewHistoryEntry {
  const { title, subtitle, speaker, event_date, event_time, location } = snapshot.form
  return {
    poster_key: snapshot.poster_key, title, subtitle, speaker, event_date, event_time, location,
    color_scheme: snapshot.color_scheme, snapshot,
  }
}

// Najnowsze wpisy wspólnej historii, od najświeższego.
export async function listHistory(client: SupabaseClient): Promise<HistoryEntry[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(HISTORY_LIMIT)
  if (error) throw new Error(error.message)
  return data as HistoryEntry[]
}

// Dopisuje wpis i zwraca go w postaci zapisanej w bazie (z `id` i datą).
export async function addHistoryEntry(client: SupabaseClient, entry: NewHistoryEntry): Promise<HistoryEntry> {
  const { data, error } = await client.from(TABLE).insert(entry).select(COLUMNS).single()
  if (error) throw new Error(error.message)
  return data as HistoryEntry
}

export async function deleteHistoryEntry(client: SupabaseClient, id: number): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
