// Czysty stan listy wczytywanej z serwera (patrz `useRemoteList`): bez Reacta
// i sieci, żeby przejścia dało się przetestować w node.

// `idle` - lista nieaktywna (np. użytkownik niezalogowany); `loading` - dla tego
// użytkownika nic jeszcze nie wczytano.
export type RemoteListStatus = 'idle' | 'loading' | 'ready' | 'error'

export type ListUpdate<T> = (items: T[]) => T[]

export interface RemoteListState<T> {
  // Użytkownik, którego dotyczy lista (`null` = nikt).
  scope: string | null
  status: RemoteListStatus
  items: T[]
  // Trwa odświeżanie w tle: pozycje zostają widoczne do czasu wyniku.
  refreshing: boolean
  // Zmiany naniesione lokalnie (`setItems`), gdy żądanie było w drodze. Wynik
  // serwera mógł powstać przed nimi, więc po jego nadejściu nanosimy je jeszcze
  // raz, w tej samej kolejności. Muszą więc być odporne na powtórzenie (podmiana
  // po id, filtr, dopisanie bez duplikatu) - wtedy usunięta pozycja nie wraca.
  pending: ListUpdate<T>[]
}

export type RemoteListAction<T> =
  | { type: 'begin'; scope: string | null }
  | { type: 'loaded'; scope: string; items: T[] }
  | { type: 'failed'; scope: string }
  | { type: 'update'; scope: string; update: ListUpdate<T> }

export function initialListState<T>(scope: string | null): RemoteListState<T> {
  return { scope, status: scope === null ? 'idle' : 'loading', items: [], refreshing: false, pending: [] }
}

const inFlight = (state: Pick<RemoteListState<unknown>, 'status' | 'refreshing'>) => state.status === 'loading' || state.refreshing

export function remoteListReducer<T>(state: RemoteListState<T>, action: RemoteListAction<T>): RemoteListState<T> {
  if (action.type === 'begin') {
    // Inny użytkownik (albo wylogowanie): czyścimy od razu, by nikt nie zobaczył cudzej listy.
    if (action.scope === null && state.scope === null) return state
    if (action.scope !== state.scope || action.scope === null) return initialListState(action.scope)
    // Ponowna próba po błędzie to znów „ładowanie"; wczytana lista odświeża się w tle.
    if (state.status === 'error') return { ...state, status: 'loading', refreshing: false }
    return state.status === 'ready' ? { ...state, refreshing: true } : state
  }
  // Wynik, zmiana albo błąd innego użytkownika niż bieżący nie liczą się.
  if (action.scope !== state.scope) return state

  switch (action.type) {
    case 'loaded':
      return {
        ...state,
        status: 'ready',
        items: state.pending.reduce((items, update) => update(items), action.items),
        refreshing: false,
        pending: [],
      }
    case 'failed':
      // Nieudane odświeżanie nie zabiera wczytanej listy; błąd widać tylko wtedy, gdy nic nie ma.
      return state.status === 'ready' ? { ...state, refreshing: false, pending: [] } : { ...state, status: 'error', items: [], refreshing: false, pending: [] }
    case 'update':
      return {
        ...state,
        items: action.update(state.items),
        pending: inFlight(state) ? [...state.pending, action.update] : state.pending,
      }
  }
}

// Co widzi komponent: stan innego użytkownika niż bieżący to jeszcze puste
// ładowanie (zanim efekt zdąży go podmienić).
export function viewOf<T>(state: RemoteListState<T>, scope: string | null): RemoteListState<T> {
  return state.scope === scope ? state : initialListState<T>(scope)
}
