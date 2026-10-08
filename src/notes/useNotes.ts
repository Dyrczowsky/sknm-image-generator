import { useState } from 'react'
import { requireSupabase } from '../supabase/client'
import { useRemoteList } from '../supabase/useRemoteList'
import { addNote, deleteNote, listNotes, sortNotes, updateNote } from './remoteNotes'
import type { Note, NoteChange } from './remoteNotes'

const loadNotes = () => listNotes(requireSupabase())

// Wspólna lista zadań - aktywna tylko po zalogowaniu (`member` = zalogowana
// osoba albo `null`). Nieudana zmiana zostawia listę bez zmian i ustawia
// `actionError`.
export function useNotes(member: string | null) {
  const list = useRemoteList(member, loadNotes)
  const [actionError, setActionError] = useState<string | null>(null)

  // Wykonuje zmianę na serwerze, a po sukcesie nanosi ją na listę.
  const run = async <T>(action: () => Promise<T>, apply: (notes: Note[], result: T) => Note[]): Promise<boolean> => {
    setActionError(null)
    try {
      const result = await action()
      list.setItems((notes) => sortNotes(apply(notes, result)))
      return true
    } catch {
      setActionError('Nie udało się zapisać zmiany. Spróbuj ponownie.')
      return false
    }
  }

  const add = (text: string) => run(() => addNote(requireSupabase(), text), (notes, added) => [added, ...notes.filter((note) => note.id !== added.id)])

  const change = (id: number, noteChange: NoteChange) =>
    run(
      () => updateNote(requireSupabase(), id, noteChange),
      (notes, updated) => notes.map((note) => (note.id === id ? updated : note)),
    )

  const remove = (id: number) =>
    run(
      () => deleteNote(requireSupabase(), id),
      (notes) => notes.filter((note) => note.id !== id),
    )

  return { status: list.status, items: list.items, reload: list.reload, actionError, add, change, remove }
}

export type Notes = ReturnType<typeof useNotes>
