import { useEffect, useReducer, useState } from 'react'
import { initialListState, remoteListReducer, viewOf } from './remoteListState'
import type { ListUpdate, RemoteListState, RemoteListStatus } from './remoteListState'

export type { RemoteListStatus }

// Lista wczytywana z serwera dla użytkownika `scope` (`null` = nikt nie jest
// zalogowany: lista pusta i nieaktywna). Zmiana użytkownika wczytuje ją od nowa
// i od razu czyści; `reload()` odświeża ją w tle - dotychczasowe pozycje zostają
// widoczne, a zmiany naniesione w międzyczasie przez `setItems` nie giną.
// `load` musi być stabilną funkcją (np. z poziomu modułu).
export function useRemoteList<T>(scope: string | null, load: () => Promise<T[]>) {
  const [state, dispatch] = useReducer(remoteListReducer<T>, scope, initialListState<T>)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    dispatch({ type: 'begin', scope })
    if (scope === null) return
    let cancelled = false
    load().then(
      (items) => {
        if (!cancelled) dispatch({ type: 'loaded', scope, items })
      },
      () => {
        if (!cancelled) dispatch({ type: 'failed', scope })
      },
    )
    return () => {
      cancelled = true
    }
  }, [scope, load, reloads])

  const view: RemoteListState<T> = viewOf(state, scope)

  return {
    status: view.status,
    items: view.items,
    reload: () => setReloads((n) => n + 1),
    // Nanosi lokalną zmianę (po udanym zapisie na serwerze) na wczytaną listę.
    // Działa też w trakcie ładowania i odświeżania; patrz `RemoteListState.pending`.
    setItems: (update: ListUpdate<T>) => {
      if (scope !== null) dispatch({ type: 'update', scope, update })
    },
  }
}
