import { useCallback, useSyncExternalStore } from 'react'

// Czy okno spełnia zapytanie CSS (np. `NARROW_QUERY`), śledzone na
// żywo. Do rzeczy, których sam CSS nie umie - np. atrybutu `inert` zależnego
// od szerokości okna. Poza przeglądarką (testy) zawsze `false`.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
