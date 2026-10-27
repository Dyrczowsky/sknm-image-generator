import { useEffect, useState, useSyncExternalStore } from 'react'
import { DeckEditor } from '../components/slides/DeckEditor'
import { DeckList } from '../components/slides/DeckList'
import type { NewDeckKind } from '../components/slides/DeckList'
import { Button, Icon } from '../components/ui'
import { createEmptyDeck, createStarterDeck } from '../slides/starter'
import type { Deck } from '../slides/types'
import type { Decks } from '../slides/useDecks'
import { routeHref } from '../utils/route'

// Otwarta prezentacja siedzi w hashu (`#/prezentacje?d=<id>`), więc
// odświeżenie i „wstecz" działają jak na zwykłej stronie. `parseRoute`
// ignoruje sufiks `?...`, więc trasa zostaje „prezentacje".
const BASE = routeHref('presentations')

function deckIdFromHash(hash: string): string | null {
  const query = hash.indexOf('?')
  if (query === -1) return null
  return new URLSearchParams(hash.slice(query + 1)).get('d') || null
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function useOpenDeckId(): string | null {
  return useSyncExternalStore(subscribe, () => deckIdFromHash(window.location.hash), () => null)
}

// Nowy wpis w historii przeglądarki - „wstecz" wraca z edytora do listy.
const openDeck = (id: string | null) => {
  window.location.hash = id ? `${BASE}?d=${encodeURIComponent(id)}` : BASE
}

// Strona „Prezentacje": lista prezentacji albo edytor otwartej.
export function PresentationsPage({ decks }: { decks: Decks }) {
  const id = useOpenDeckId()

  const create = (kind: NewDeckKind) => {
    const deck = kind === 'starter' ? createStarterDeck() : createEmptyDeck()
    void decks.create(deck).then(() => openDeck(deck.id))
  }

  // `key` - inna prezentacja (albo powrót z listy) wczytuje zapis od nowa.
  if (id) return <OpenDeck key={id} id={id} decks={decks} />

  return (
    <div className="min-h-0 flex-1 min-[900px]:overflow-y-auto">
      <DeckList
        ready={decks.ready}
        items={decks.items}
        error={decks.error}
        onCreate={create}
        onOpen={openDeck}
        onDuplicate={(source) => void decks.duplicate(source)}
        onRemove={(remove) => void decks.remove(remove)}
      />
    </div>
  )
}

// Wynik wczytania: `null` w `deck` = nie udało się.
type Loaded = { deck: Deck | null } | null

function OpenDeck({ id, decks }: { id: string; decks: Decks }) {
  const [loaded, setLoaded] = useState<Loaded>(null)
  const { load } = decks

  useEffect(() => {
    let alive = true
    void load(id).then((deck) => {
      if (alive) setLoaded({ deck })
    })
    return () => {
      alive = false
    }
  }, [id, load])

  if (loaded?.deck) return <DeckEditor deck={loaded.deck} decks={decks} onClose={() => openDeck(null)} />

  // Wpis w indeksie, którego nie da się wczytać = zapis z nowszej wersji
  // aplikacji albo uszkodzony (useDecks nie mówi, który) - inny komunikat niż brak.
  const unreadable = decks.items.some((item) => item.id === id)

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      {!loaded ? (
        <p className="m-0 flex items-center gap-2 text-muted" role="status">
          <Icon name="spinner" className="animate-spin" />
          Wczytywanie prezentacji…
        </p>
      ) : (
        <div className="flex max-w-[44ch] flex-col items-center gap-3 text-center" role="alert">
          <Icon name="warning" size="lg" className="text-warning" />
          <p className="m-0 font-semibold">{unreadable ? 'Nie da się otworzyć tej prezentacji.' : 'Tej prezentacji nie ma na tym urządzeniu.'}</p>
          <p className="m-0 text-[0.875rem] text-muted">
            {unreadable
              ? 'Zapisała ją nowsza wersja aplikacji albo zapis jest uszkodzony. Odśwież stronę, żeby wczytać najnowszą wersję aplikacji.'
              : 'Mogła zostać usunięta albo zapisana w innej przeglądarce - prezentacje nie trafiają do chmury.'}
          </p>
          <Button icon="arrowLeft" onClick={() => openDeck(null)}>
            Wszystkie prezentacje
          </Button>
        </div>
      )}
    </div>
  )
}
