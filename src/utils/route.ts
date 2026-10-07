import { useCallback, useSyncExternalStore } from 'react'

export type Page = 'editor' | 'projects' | 'assets' | 'history' | 'notes'

export const PAGES: readonly { page: Page; hash: string; label: string }[] = [
  { page: 'editor', hash: '#/', label: 'Edytor' },
  { page: 'projects', hash: '#/projekty', label: 'Projekty' },
  { page: 'assets', hash: '#/grafiki', label: 'Grafiki' },
  { page: 'history', hash: '#/historia', label: 'Historia' },
  { page: 'notes', hash: '#/notatki', label: 'Notatki' },
]

// Tolerancyjny odczyt strony z `location.hash`. Rozpoznajemy tylko ścieżki
// (`#/projekty`, bez wielkości liter, z końcowym `/` i sufiksem `?...`).
// Hashe z tokenami Supabase (`#access_token=...&type=recovery`) nie są
// ścieżkami, więc trafiają do edytora; funkcja nigdy nie rzuca.
export function parseRoute(hash: string): Page {
  if (typeof hash !== 'string') return 'editor'
  let path = hash.startsWith('#') ? hash.slice(1) : hash
  const query = path.indexOf('?')
  if (query !== -1) path = path.slice(0, query)
  path = path.toLowerCase().replace(/\/+$/, '')
  const found = PAGES.find(p => p.hash.slice(1).replace(/\/+$/, '') === path)
  return found?.page ?? 'editor'
}

export function routeHref(page: Page): string {
  return PAGES.find(p => p.page === page)?.hash ?? '#/'
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getSnapshot = (): Page => (typeof window === 'undefined' ? 'editor' : parseRoute(window.location.hash))
const getServerSnapshot = (): Page => 'editor'

// Aktualna strona zsynchronizowana z hashem (przyciski wstecz/dalej działają).
export function useHashRoute(): [Page, (page: Page) => void] {
  const page = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const setPage = useCallback((next: Page) => {
    if (typeof window !== 'undefined') window.location.hash = routeHref(next)
  }, [])
  return [page, setPage]
}
