import { beforeEach, describe, expect, it, vi } from 'vitest'
import { register, resetRegistry } from '../assets/registry'
import { createDeck, createSlide } from './deck'
import { DECK_INDEX_KEY, createDeckStore, deckKey, fromStored, toStored } from './deckStore'
import type { Deck, PhotoValue } from './types'

// Jedyny istniejący układ (Cytat) nie ma zdjęcia, a parseDeck odrzuca pola spoza
// `defaults` układu - więc test podstawia układ ze zdjęciem.
vi.mock('./komponenty', () => ({
  layoutOf: (key: string) =>
    key === 'foto' ? { key: 'foto', defaults: { zdjecie: { src: null, x: 50, y: 50, zoom: 1 } } } : undefined,
}))

const REF = `${'b'.repeat(64)}.jpg`
const DATA_URL = 'data:image/jpeg;base64,AAAA'

function memory() {
  const map = new Map<string, unknown>()
  // Fałszywy resolver: każda nazwa jest „wczytana” (rejestr już ją zna).
  const store = createDeckStore(
    {
      get: async (key) => map.get(key),
      set: async (key, value) => void map.set(key, structuredClone(value)),
      del: async (key) => void map.delete(key),
    },
    async () => [],
  )
  return { store, map }
}

function deckWithPhoto(src: string | null, updatedAt = 1): Deck {
  const slide = createSlide('foto')
  slide.data = { ...slide.data, zdjecie: { src, x: 10, y: 20, zoom: 1.5 } satisfies PhotoValue }
  return { ...createDeck('Test', [slide]), updatedAt }
}

const photoOf = (deck: Deck) => deck.slides[0].data.zdjecie as PhotoValue

describe('deckStore', () => {
  beforeEach(() => resetRegistry())

  it('save → list → load', async () => {
    const { store } = memory()
    const deck = deckWithPhoto(null, 5)
    await store.save(deck)
    expect(await store.list()).toEqual([
      { id: deck.id, name: 'Test', updatedAt: 5, slideCount: 1, firstLayout: 'foto' },
    ])
    const loaded = await store.load(deck.id)
    expect(loaded.ok && loaded.deck.id).toBe(deck.id)
  })

  it('zdjęcie: data URL → ref przy zapisie, z powrotem przy odczycie', async () => {
    register(REF, DATA_URL)
    const { store, map } = memory()
    const deck = deckWithPhoto(DATA_URL)
    await store.save(deck)
    expect(photoOf(map.get(deckKey(deck.id)) as Deck).src).toBe(REF)
    expect(photoOf(deck).src).toBe(DATA_URL)
    const loaded = await store.load(deck.id)
    expect(loaded.ok && photoOf(loaded.deck).src).toBe(DATA_URL)
  })

  it('nieznany data URL zostaje w zapisie', () => {
    expect(photoOf(toStored(deckWithPhoto(DATA_URL))).src).toBe(DATA_URL)
  })

  it('ref, którego nie da się wczytać, daje src null', async () => {
    const raw = toStored(deckWithPhoto(REF))
    const loaded = await fromStored(raw, async (refs) => refs)
    expect(loaded.ok && photoOf(loaded.deck).src).toBeNull()
  })

  it('indeks posortowany po updatedAt malejąco, upsert bez duplikatów', async () => {
    const { store } = memory()
    const a = deckWithPhoto(null, 1)
    const b = deckWithPhoto(null, 3)
    await store.save(a)
    await store.save(b)
    expect((await store.list()).map((e) => e.id)).toEqual([b.id, a.id])
    await store.save({ ...a, updatedAt: 9 })
    expect((await store.list()).map((e) => e.id)).toEqual([a.id, b.id])
  })

  it('remove usuwa wpis i indeks', async () => {
    const { store, map } = memory()
    const deck = deckWithPhoto(null)
    await store.save(deck)
    await store.remove(deck.id)
    expect(await store.list()).toEqual([])
    expect(map.has(deckKey(deck.id))).toBe(false)
    expect(await store.load(deck.id)).toEqual({ ok: false, reason: 'missing' })
  })

  it('uszkodzony wpis → invalid', async () => {
    const { store, map } = memory()
    map.set(deckKey('x'), { nonsens: true })
    expect(await store.load('x')).toEqual({ ok: false, reason: 'invalid' })
    expect(map.has(DECK_INDEX_KEY)).toBe(false)
  })
})
