import { useState } from 'react'
import type { NewHistoryEntry } from '../types'
import { requireSupabase } from '../supabase/client'
import { useRemoteList } from '../supabase/useRemoteList'
import { HISTORY_LIMIT, addHistoryEntry, deleteHistoryEntry, listHistory } from './remoteHistory'

const loadHistory = () => listHistory(requireSupabase())

// Wspólna historia wygenerowanych plakatów - aktywna tylko po zalogowaniu
// (`member` = zalogowana osoba albo `null`).
export function useHistory(member: string | null) {
  const list = useRemoteList(member, loadHistory)
  const [actionError, setActionError] = useState<string | null>(null)

  // Dopisuje wpis po udanym eksporcie. Rzuca, gdy zapis się nie powiódł -
  // eksport pokazuje wtedy własny komunikat.
  const record = async (entry: NewHistoryEntry) => {
    const saved = await addHistoryEntry(requireSupabase(), entry)
    // Bez duplikatu: odświeżenie w tle mogło już przynieść ten wpis.
    list.setItems((items) => [saved, ...items.filter((item) => item.id !== saved.id)].slice(0, HISTORY_LIMIT))
  }

  const remove = async (id: number) => {
    setActionError(null)
    try {
      await deleteHistoryEntry(requireSupabase(), id)
      list.setItems((items) => items.filter((item) => item.id !== id))
    } catch {
      setActionError('Nie udało się usunąć wpisu. Spróbuj ponownie.')
    }
  }

  return { status: list.status, items: list.items, reload: list.reload, actionError, record, remove }
}
