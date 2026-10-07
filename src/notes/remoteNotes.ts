import type { SupabaseClient } from '@supabase/supabase-js'

// Pozycja wspólnej listy zadań.
export interface Note {
  id: number
  // Znacznik czasu ISO.
  created_at: string
  author_email: string
  text: string
  done: boolean
}

export type NoteChange = Partial<Pick<Note, 'text' | 'done'>>

const TABLE = 'sknm_notes'
const COLUMNS = 'id, created_at, author_email, text, done'
export const NOTES_LIMIT = 200
export const NOTE_MAX_LENGTH = 500

// Kolejność listy: najpierw otwarte, potem zrobione; w obu grupach od najnowszej.
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => Number(a.done) - Number(b.done) || b.created_at.localeCompare(a.created_at) || b.id - a.id,
  )
}

export async function listNotes(client: SupabaseClient): Promise<Note[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .order('done', { ascending: true })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(NOTES_LIMIT)
  if (error) throw new Error(error.message)
  return data as Note[]
}

// Autora i datę uzupełnia baza z sesji - klient podaje tylko treść.
export async function addNote(client: SupabaseClient, text: string): Promise<Note> {
  const { data, error } = await client.from(TABLE).insert({ text }).select(COLUMNS).single()
  if (error) throw new Error(error.message)
  return data as Note
}

export async function updateNote(client: SupabaseClient, id: number, change: NoteChange): Promise<Note> {
  const { data, error } = await client.from(TABLE).update(change).eq('id', id).select(COLUMNS).single()
  if (error) throw new Error(error.message)
  return data as Note
}

export async function deleteNote(client: SupabaseClient, id: number): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
