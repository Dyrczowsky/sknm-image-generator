import type { SupabaseClient } from '@supabase/supabase-js'
import type { FormValues, HistoryEntry, NewHistoryEntry } from '../types'

const TABLE = 'sknm_poster_history'
const COLUMNS = 'id, created_at, poster_key, title, subtitle, speaker, event_date, event_time, location, color_scheme'
export const HISTORY_LIMIT = 50

// Wpis historii dla bieżącego stanu edytora. Historia trzyma tylko pola
// wydarzenia, layout i kolorystykę - bez grafik, zdjęć i plakietek.
export function newHistoryEntry(posterKey: string, form: FormValues, colorScheme: string | undefined): NewHistoryEntry {
  const { title, subtitle, speaker, event_date, event_time, location } = form
  return { poster_key: posterKey, title, subtitle, speaker, event_date, event_time, location, color_scheme: colorScheme ?? null }
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
