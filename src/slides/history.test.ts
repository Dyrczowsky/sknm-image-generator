import { describe, expect, it } from 'vitest'
import {
  COALESCE_MS,
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  initHistory,
  pushHistory,
  redo,
  replacePresent,
  undo,
} from './history'

describe('historia cofnij/ponów', () => {
  it('cofa i ponawia w kolejności', () => {
    let h = initHistory('a')
    h = pushHistory(h, 'b')
    h = pushHistory(h, 'c')

    h = undo(h)
    expect(h.present).toBe('b')
    h = undo(h)
    expect(h.present).toBe('a')
    expect(canUndo(h)).toBe(false)

    h = redo(h)
    expect(h.present).toBe('b')
    h = redo(h)
    expect(h.present).toBe('c')
    expect(canRedo(h)).toBe(false)
  })

  it('nowy zapis czyści future', () => {
    let h = initHistory('a')
    h = pushHistory(h, 'b')
    h = undo(h)
    expect(canRedo(h)).toBe(true)

    h = pushHistory(h, 'x')
    expect(canRedo(h)).toBe(false)
    expect(h.future).toEqual([])
  })

  it('skleja zmiany z tym samym kluczem w czasie poniżej 1000 ms', () => {
    let h = initHistory('')
    h = pushHistory(h, 'p', { key: 'title', now: 0 })
    h = pushHistory(h, 'pa', { key: 'title', now: 300 })
    h = pushHistory(h, 'paj', { key: 'title', now: 600 })

    expect(h.past).toEqual([''])
    expect(h.present).toBe('paj')

    h = undo(h)
    expect(h.present).toBe('')
    expect(canUndo(h)).toBe(false)
  })

  it('nie skleja po upływie COALESCE_MS', () => {
    let h = initHistory('')
    h = pushHistory(h, 'a', { key: 'title', now: 0 })
    h = pushHistory(h, 'ab', { key: 'title', now: COALESCE_MS })

    expect(h.past).toEqual(['', 'a'])
    expect(h.present).toBe('ab')
  })

  it('nie skleja przy innym kluczu ani bez klucza', () => {
    let h = initHistory('')
    h = pushHistory(h, 'a', { key: 'title', now: 0 })
    h = pushHistory(h, 'a2', { key: 'speaker', now: 10 })
    expect(h.past).toEqual(['', 'a'])

    h = pushHistory(h, 'a3', { now: 20 })
    expect(h.past).toEqual(['', 'a', 'a2'])

    h = pushHistory(h, 'a4', { now: 30 })
    expect(h.past).toEqual(['', 'a', 'a2', 'a3'])
  })

  it('ogranicza past do HISTORY_LIMIT, usuwając najstarsze', () => {
    let h = initHistory(0)
    for (let i = 1; i <= HISTORY_LIMIT + 50; i++) h = pushHistory(h, i)

    expect(h.past).toHaveLength(HISTORY_LIMIT)
    expect(h.present).toBe(HISTORY_LIMIT + 50)
    expect(h.past[0]).toBe(50)

    for (let i = 0; i < HISTORY_LIMIT; i++) h = undo(h)
    expect(h.present).toBe(50)
    expect(canUndo(h)).toBe(false)
  })

  it('po cofnięciu zapis z tym samym kluczem nie skleja się ze starszym pisaniem', () => {
    let h = initHistory('')
    h = pushHistory(h, 'a', { key: 'title', now: 0 })
    h = undo(h)
    h = pushHistory(h, 'b', { key: 'title', now: 100 })

    expect(h.past).toEqual([''])
    expect(h.present).toBe('b')
  })

  it('zapis tego samego obiektu (===) zwraca historię bez zmian', () => {
    const h = initHistory({ n: 1 })
    expect(pushHistory(h, h.present)).toBe(h)

    const h2 = pushHistory(h, { n: 2 })
    expect(pushHistory(h2, h2.present, { key: 'k' })).toBe(h2)
  })

  it('undo i redo bez wpisów zwracają to samo h', () => {
    const h = initHistory('a')
    expect(undo(h)).toBe(h)
    expect(redo(h)).toBe(h)
  })

  it('replacePresent zmienia stan bez wpisu w historii', () => {
    let h = initHistory('a')
    h = pushHistory(h, 'b')
    h = undo(h)

    const r = replacePresent(h, 'a-zapisane')
    expect(r.present).toBe('a-zapisane')
    expect(r.past).toEqual(h.past)
    expect(r.future).toEqual(h.future)
    expect(canRedo(r)).toBe(true)
  })

  it('replacePresent nie przerywa sklejania pisania', () => {
    let h = initHistory('')
    h = pushHistory(h, 'a', { key: 'title', now: 0 })
    h = replacePresent(h, 'a!')
    h = pushHistory(h, 'ab', { key: 'title', now: 200 })

    expect(h.past).toEqual([''])
    expect(h.present).toBe('ab')
  })
})
