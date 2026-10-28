import { del, get, set } from 'idb-keyval'
import { hydrate } from '../assets/assets'
import type { KeyValueStore } from '../assets/localStore'
import { isAssetRef } from '../assets/hash'
import { refOf, srcOf } from '../assets/registry'
import { parseDeck } from './deck'
import type { Deck, PhotoValue, SlideValue } from './types'

// Lista prezentacji (lekka, do ekranu wyboru) i osobny wpis na każdą
// prezentację - dzięki temu lista nie wymaga wczytywania całych treści.
export const DECK_INDEX_KEY = 'sknm-deck-index'
export const deckKey = (id: string): string => `sknm-deck:${id}`

export interface DeckIndexEntry {
  id: string
  name: string
  updatedAt: number
  slideCount: number
  firstLayout: string | null
}

export type DeckLoad = { ok: true; deck: Deck } | { ok: false; reason: 'missing' | 'invalid' | 'newer' }

export interface DeckStore {
  list(): Promise<DeckIndexEntry[]>
  load(id: string): Promise<DeckLoad>
  save(deck: Deck): Promise<void>
  remove(id: string): Promise<void>
}

type Resolver = (refs: string[]) => Promise<string[]>

const isPhoto = (value: unknown): value is PhotoValue => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return 'src' in value && 'x' in value && 'y' in value && 'zoom' in value
}

// Zamienia src każdego zdjęcia funkcją `map`; reszta treści to zwykły JSON,
// więc głęboka kopia wystarcza i nie dotyka stanu aplikacji.
function mapPhotos(deck: Deck, map: (src: string) => string | null): Deck {
  return {
    ...deck,
    slides: deck.slides.map((slide) => {
      const data: Record<string, SlideValue> = {}
      for (const [key, value] of Object.entries(slide.data)) {
        if (isPhoto(value)) data[key] = { ...value, src: typeof value.src === 'string' ? map(value.src) : value.src }
        else data[key] = structuredClone(value)
      }
      return { ...slide, data }
    }),
  }
}

// Do bazy idzie nazwa grafiki zamiast ogromnego data URL. Gdy rejestr jej nie
// zna, zostaje data URL - lepiej zająć miejsce niż stracić zdjęcie.
export function toStored(deck: Deck): Deck {
  return mapPhotos(deck, (src) => (src.startsWith('data:') ? (refOf(src) ?? src) : src))
}

const defaultResolve: Resolver = (refs) => hydrate(refs, null)

export async function fromStored(raw: unknown, resolve: Resolver = defaultResolve): Promise<DeckLoad> {
  const parsed = parseDeck(raw)
  if (!parsed.ok) return parsed
  const refs = new Set<string>()
  mapPhotos(parsed.deck, (src) => {
    if (isAssetRef(src)) refs.add(src)
    return src
  })
  if (refs.size === 0) return { ok: true, deck: parsed.deck }
  // `resolve` zwraca nazwy, których NIE udało się wczytać (jak `hydrate`).
  const missing = new Set(await resolve([...refs]))
  return {
    ok: true,
    deck: mapPhotos(parsed.deck, (src) => {
      if (!isAssetRef(src)) return src
      // Nieudane wczytanie zostawia nazwę grafiki: kolejny autozapis musi ją
      // zachować (PhotoFigure rysuje wtedy „brak zdjęcia"), a nie nadpisać `null`.
      return missing.has(src) ? src : (srcOf(src) ?? src)
    }),
  }
}

export function createDeckStore(kv: Pick<KeyValueStore, 'get' | 'set' | 'del'>, resolve: Resolver = defaultResolve): DeckStore {
  const readIndex = async (): Promise<DeckIndexEntry[]> => {
    const raw = await kv.get(DECK_INDEX_KEY)
    return Array.isArray(raw) ? (raw as DeckIndexEntry[]) : []
  }
  const sorted = (entries: DeckIndexEntry[]) => [...entries].sort((a, b) => b.updatedAt - a.updatedAt)
  // Zapis i usuwanie czytają indeks, zmieniają go i zapisują - równoległe
  // wywołania (opóźniony zapis + „Nowa prezentacja") gubiłyby wpisy. Kolejka
  // wykonuje je po jednym; błąd jednego nie blokuje następnych.
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task)
    queue = run.catch(() => {})
    return run
  }
  return {
    list: async () => sorted(await readIndex()),
    async load(id) {
      const raw = await kv.get(deckKey(id))
      if (raw === undefined || raw === null) return { ok: false, reason: 'missing' }
      return fromStored(raw, resolve)
    },
    save: (deck) => serial(async () => {
      // Najpierw treść, potem indeks: przerwany zapis nie zostawi wpisu bez prezentacji.
      await kv.set(deckKey(deck.id), toStored(deck))
      const entry: DeckIndexEntry = {
        id: deck.id,
        name: deck.name,
        updatedAt: deck.updatedAt,
        slideCount: deck.slides.length,
        firstLayout: deck.slides[0]?.layout ?? null,
      }
      const index = await readIndex()
      await kv.set(DECK_INDEX_KEY, sorted([...index.filter((e) => e.id !== deck.id), entry]))
    }),
    remove: (id) => serial(async () => {
      await kv.del(deckKey(id))
      const index = await readIndex()
      await kv.set(DECK_INDEX_KEY, index.filter((e) => e.id !== id))
    }),
  }
}

export const deckStore: DeckStore = createDeckStore({ get, set, del })
