import { useCallback, useEffect, useRef, useState } from 'react'
import { newId } from './deck'
import { deckStore } from './deckStore'
import type { DeckIndexEntry, DeckStore } from './deckStore'
import type { Deck } from './types'

export interface Decks {
  ready: boolean
  items: DeckIndexEntry[]
  error: string | null
  load(id: string): Promise<Deck | null>
  // Z opóźnieniem 400 ms na prezentację; updatedAt ustawia dopiero zapis.
  save(deck: Deck): void
  flush(): Promise<void>
  create(deck: Deck): Promise<void>
  remove(id: string): Promise<void>
  duplicate(id: string): Promise<Deck | null>
}

const DEBOUNCE_MS = 400
const SAVE_ERROR = 'Nie udało się zapisać prezentacji na tym urządzeniu.'
const READ_ERROR = 'Nie udało się odczytać prezentacji z tego urządzenia.'

export function useDecks(store: DeckStore = deckStore): Decks {
  const [ready, setReady] = useState(false)
  const [items, setItems] = useState<DeckIndexEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  // Oczekujące zapisy: ostatnia wersja i timer na każdy id.
  const pending = useRef(new Map<string, { deck: Deck; timer: ReturnType<typeof setTimeout> }>())
  const alive = useRef(true)

  const refresh = useCallback(async () => {
    const list = await store.list()
    if (alive.current) setItems(list)
  }, [store])

  const write = useCallback(
    async (deck: Deck) => {
      try {
        await store.save({ ...deck, updatedAt: Date.now() })
        // Udany zapis znosi wcześniejszy komunikat - dane znów są bezpieczne.
        if (alive.current) setError(null)
        await refresh()
      } catch {
        if (alive.current) setError(SAVE_ERROR)
      }
    },
    [store, refresh],
  )

  const flush = useCallback(async () => {
    const entries = [...pending.current.values()]
    pending.current.clear()
    for (const entry of entries) clearTimeout(entry.timer)
    await Promise.all(entries.map((entry) => write(entry.deck)))
  }, [write])

  useEffect(() => {
    alive.current = true
    refresh()
      .catch(() => setError(READ_ERROR))
      .finally(() => alive.current && setReady(true))
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    const onPageHide = () => void flush()
    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('visibilitychange', onHide)
      // Zapis przy odmontowaniu - nie gubimy ostatniej edycji.
      void flush()
      alive.current = false
    }
  }, [refresh, flush])

  const save = useCallback(
    (deck: Deck) => {
      const previous = pending.current.get(deck.id)
      if (previous) clearTimeout(previous.timer)
      const timer = setTimeout(() => {
        pending.current.delete(deck.id)
        void write(deck)
      }, DEBOUNCE_MS)
      pending.current.set(deck.id, { deck, timer })
    },
    [write],
  )

  const load = useCallback(
    async (id: string) => {
      // Niezapisana edycja musi być w bazie, zanim ją odczytamy.
      await flush()
      try {
        const result = await store.load(id)
        return result.ok ? result.deck : null
      } catch {
        setError(READ_ERROR)
        return null
      }
    },
    [store, flush],
  )

  const create = useCallback((deck: Deck) => write(deck), [write])

  const remove = useCallback(
    async (id: string) => {
      const entry = pending.current.get(id)
      if (entry) clearTimeout(entry.timer)
      pending.current.delete(id)
      try {
        await store.remove(id)
        if (alive.current) setError(null)
        await refresh()
      } catch {
        setError(SAVE_ERROR)
      }
    },
    [store, refresh],
  )

  const duplicate = useCallback(
    async (id: string) => {
      const source = await load(id)
      if (!source) return null
      const copy: Deck = { ...source, id: newId(), name: `${source.name} (kopia)` }
      await write(copy)
      return copy
    },
    [load, write],
  )

  return { ready, items, error, load, save, flush, create, remove, duplicate }
}
