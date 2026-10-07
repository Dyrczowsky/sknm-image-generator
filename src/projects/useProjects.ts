import { useState } from 'react'
import { requireSupabase } from '../supabase/client'
import { useRemoteList } from '../supabase/useRemoteList'
import { deleteProject, listProjects, renameProject, setProjectShared } from './remoteProjects'
import type { ProjectRow } from './remoteProjects'

const loadProjects = () => listProjects(requireSupabase())

const byRecent = (a: ProjectRow, b: ProjectRow) => b.updated_at.localeCompare(a.updated_at) || b.id - a.id

// Projekty zalogowanej osoby (`userId` albo `null`) i udostępnione zespołowi.
// Nieudana zmiana zostawia listę bez zmian i ustawia `actionError`.
export function useProjects(userId: string | null) {
  const list = useRemoteList(userId, loadProjects)
  const [actionError, setActionError] = useState<string | null>(null)

  const run = async <T>(action: () => Promise<T>, apply: (projects: ProjectRow[], result: T) => ProjectRow[]): Promise<boolean> => {
    setActionError(null)
    try {
      const result = await action()
      list.setItems((projects) => apply(projects, result))
      return true
    } catch {
      setActionError('Nie udało się zapisać zmiany. Spróbuj ponownie.')
      return false
    }
  }

  // Dodaje albo podmienia wiersz (np. po zapisie projektu) bez ponownego pobierania.
  const upsert = (row: ProjectRow) =>
    list.setItems((projects) => [row, ...projects.filter((p) => p.id !== row.id)].sort(byRecent))

  const replace = (projects: ProjectRow[], updated: ProjectRow) => projects.map((p) => (p.id === updated.id ? updated : p))

  const rename = (id: number, name: string) => run(() => renameProject(requireSupabase(), id, name), replace)

  const setShared = (id: number, shared: boolean) => run(() => setProjectShared(requireSupabase(), id, shared), replace)

  const remove = (id: number) =>
    run(
      () => deleteProject(requireSupabase(), id),
      (projects) => projects.filter((p) => p.id !== id),
    )

  return { status: list.status, items: list.items, reload: list.reload, actionError, upsert, rename, setShared, remove }
}

export type Projects = ReturnType<typeof useProjects>
