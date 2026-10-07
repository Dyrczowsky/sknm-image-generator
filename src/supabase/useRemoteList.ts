import { useEffect, useState } from 'react'

// `idle` - lista nieaktywna (np. użytkownik niezalogowany).
export type RemoteListStatus = 'idle' | 'loading' | 'ready' | 'error'

interface Loaded<T> {
  // Żądanie, którego dotyczy wynik (patrz `requestKey`).
  key: string
  status: 'ready' | 'error'
  items: T[]
}

// Lista wczytywana z serwera dla użytkownika `scope` (`null` = nikt nie jest
// zalogowany: lista pusta i nieaktywna). Zmiana użytkownika albo `reload()`
// wczytuje ją od nowa. `load` musi być stabilną funkcją (np. z poziomu modułu).
export function useRemoteList<T>(scope: string | null, load: () => Promise<T[]>) {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null)
  const [reloads, setReloads] = useState(0)
  const requestKey = `${scope}#${reloads}`

  useEffect(() => {
    if (scope === null) return
    let cancelled = false
    load().then(
      (items) => {
        if (!cancelled) setLoaded({ key: requestKey, status: 'ready', items })
      },
      () => {
        if (!cancelled) setLoaded({ key: requestKey, status: 'error', items: [] })
      },
    )
    return () => {
      cancelled = true
    }
  }, [scope, load, requestKey])

  // Wynik innego żądania (inny użytkownik, starsze przeładowanie) nie liczy się.
  const current = scope !== null && loaded?.key === requestKey ? loaded : null
  const status: RemoteListStatus = scope === null ? 'idle' : (current?.status ?? 'loading')

  return {
    status,
    items: current?.items ?? [],
    reload: () => setReloads((n) => n + 1),
    // Nanosi lokalną zmianę (po udanym zapisie na serwerze) na wczytaną listę.
    setItems: (update: (items: T[]) => T[]) =>
      setLoaded((prev) => (prev?.key === requestKey ? { ...prev, items: update(prev.items) } : prev)),
  }
}
