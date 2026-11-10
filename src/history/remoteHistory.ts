import type { SupabaseClient } from '@supabase/supabase-js'
import { toPlain } from '../richText'
import type { EditorSnapshot } from '../snapshot/snapshot'
import type { HistoryEntry, NewHistoryEntry } from '../types'

const TABLE = 'sknm_poster_history'
const COLUMNS = 'id, created_at, poster_key, title, subtitle, speaker, event_date, event_time, location, color_scheme, snapshot, source, image_url'
// Kolumny sprzed migracji `source`/`image_url`: gdy aplikacja wdroży się przed
// migracją, zapytanie z nowymi kolumnami kończy się błędem, a historia przestaje działać.
const LEGACY_COLUMNS = 'id, created_at, poster_key, title, subtitle, speaker, event_date, event_time, location, color_scheme, snapshot'
export const HISTORY_LIMIT = 50

interface DbError { message: string; code?: string }

// Brak kolumny: Postgres 42703, PostgREST PGRST204 albo komunikat o `source`/`image_url`.
function isMissingColumn(error: DbError): boolean {
  if (error.code === '42703' || error.code === 'PGRST204') return true
  return /\b(source|image_url)\b/.test(error.message) && /(does not exist|could not find)/i.test(error.message)
}

const withDefaults = (row: unknown): HistoryEntry => ({ source: 'app', image_url: null, ...(row as object) }) as HistoryEntry

// Limity długości wąskich kolumn w bazie (`char_length` w migracji
// 20261007000000_history_and_notes.sql). Formularz ich nie pilnuje, więc
// dłuższy tekst (np. kilkuakapitowy opis) baza by odrzuciła razem z całym wpisem.
const COLUMN_LIMITS = { title: 500, subtitle: 500, speaker: 200, location: 200 } as const

// Czysty tekst przycięty do `max` znaków. Po punktach kodowych, jak
// `char_length` - cięcie po jednostkach UTF-16 mogłoby rozbić parę zastępczą.
const column = (value: string, max: number) => Array.from(toPlain(value)).slice(0, max).join('')

// Wpis historii dla snapshotu edytora. Wąskie kolumny (lista, starsze klienty)
// są wypełniane obok pełnego `snapshot` (sam snapshot nie zawiera obrazów -
// tylko ich nazwy, patrz src/assets/). Wąskie kolumny są przycinane do limitów
// bazy - pełny tekst i formatowanie zostają w `snapshot`.
export function newHistoryEntry(snapshot: EditorSnapshot): NewHistoryEntry {
  const { title, subtitle, speaker, event_date, event_time, location } = snapshot.form
  return {
    poster_key: snapshot.poster_key,
    title: column(title, COLUMN_LIMITS.title),
    subtitle: column(subtitle, COLUMN_LIMITS.subtitle),
    speaker: column(speaker, COLUMN_LIMITS.speaker),
    event_date, event_time,
    location: column(location, COLUMN_LIMITS.location),
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
  if (!error) return data as HistoryEntry[]
  if (!isMissingColumn(error)) throw new Error(error.message)
  const legacy = await client
    .from(TABLE)
    .select(LEGACY_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(HISTORY_LIMIT)
  if (legacy.error) throw new Error(legacy.error.message)
  return (legacy.data as unknown[]).map(withDefaults)
}

// Dopisuje wpis i zwraca go w postaci zapisanej w bazie (z `id` i datą).
export async function addHistoryEntry(client: SupabaseClient, entry: NewHistoryEntry): Promise<HistoryEntry> {
  const { data, error } = await client.from(TABLE).insert(entry).select(COLUMNS).single()
  if (!error) return data as HistoryEntry
  if (!isMissingColumn(error)) throw new Error(error.message)
  const legacy = await client.from(TABLE).insert(entry).select(LEGACY_COLUMNS).single()
  if (legacy.error) throw new Error(legacy.error.message)
  return withDefaults(legacy.data)
}

export async function deleteHistoryEntry(client: SupabaseClient, id: number): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
