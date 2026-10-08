import { describe, expect, it } from 'vitest'
import { initialListState, remoteListReducer, viewOf } from './remoteListState'
import type { RemoteListAction, RemoteListState } from './remoteListState'

interface Row {
  id: number
  name: string
}
type State = RemoteListState<Row>
type Action = RemoteListAction<Row>

const a: Row = { id: 1, name: 'A' }
const b: Row = { id: 2, name: 'B' }
const c: Row = { id: 3, name: 'C' }

const run = (state: State, ...actions: Action[]): State => actions.reduce(remoteListReducer<Row>, state)
const upsert = (row: Row) => (items: Row[]) => [row, ...items.filter((item) => item.id !== row.id)]
const without = (id: number) => (items: Row[]) => items.filter((item) => item.id !== id)

const loaded = (scope: string, items: Row[]): State => run(initialListState<Row>(scope), { type: 'loaded', scope, items })

describe('remoteListReducer', () => {
  it('pierwsze wczytanie: loading z pustą listą, potem ready', () => {
    const start = initialListState<Row>('ola')
    expect(start).toMatchObject({ status: 'loading', items: [] })
    expect(run(start, { type: 'begin', scope: 'ola' })).toMatchObject({ status: 'loading', items: [] })
    expect(run(start, { type: 'loaded', scope: 'ola', items: [a] })).toMatchObject({ status: 'ready', items: [a] })
  })

  it('bez użytkownika lista jest nieaktywna i pusta', () => {
    const idle = initialListState<Row>(null)
    expect(idle).toMatchObject({ status: 'idle', items: [] })
    expect(run(idle, { type: 'begin', scope: null })).toBe(idle)
  })

  it('odświeżenie w tle zostawia pozycje i status ready', () => {
    const state = run(loaded('ola', [a, b]), { type: 'begin', scope: 'ola' })
    expect(state).toMatchObject({ status: 'ready', items: [a, b], refreshing: true })
  })

  it('wynik odświeżenia podmienia pozycje', () => {
    const state = run(loaded('ola', [a]), { type: 'begin', scope: 'ola' }, { type: 'loaded', scope: 'ola', items: [b, c] })
    expect(state).toMatchObject({ status: 'ready', items: [b, c], refreshing: false, pending: [] })
  })

  it('zmiana użytkownika czyści listę od razu', () => {
    const state = run(loaded('ola', [a]), { type: 'begin', scope: 'ula' })
    expect(state).toMatchObject({ scope: 'ula', status: 'loading', items: [] })
  })

  it('wylogowanie czyści listę', () => {
    expect(run(loaded('ola', [a]), { type: 'begin', scope: null })).toMatchObject({ scope: null, status: 'idle', items: [] })
  })

  it('widok innego użytkownika niż w stanie jest pustym ładowaniem', () => {
    expect(viewOf(loaded('ola', [a]), 'ula')).toMatchObject({ status: 'loading', items: [] })
    expect(viewOf(loaded('ola', [a]), null)).toMatchObject({ status: 'idle', items: [] })
  })

  it('spóźniony wynik poprzedniego użytkownika jest ignorowany', () => {
    const ula = run(loaded('ola', [a]), { type: 'begin', scope: 'ula' })
    expect(run(ula, { type: 'loaded', scope: 'ola', items: [a] })).toBe(ula)
    expect(run(ula, { type: 'failed', scope: 'ola' })).toBe(ula)
    expect(run(ula, { type: 'update', scope: 'ola', update: upsert(b) })).toBe(ula)
  })

  it('zmiana w trakcie odświeżenia jest widoczna od razu i nie ginie po wyniku', () => {
    const state = run(
      loaded('ola', [a]),
      { type: 'begin', scope: 'ola' },
      { type: 'update', scope: 'ola', update: upsert(b) },
    )
    expect(state.items).toEqual([b, a])
    // Serwer odpowiedział stanem sprzed zapisu `b`.
    expect(run(state, { type: 'loaded', scope: 'ola', items: [a] }).items).toEqual([b, a])
  })

  it('zmiana, którą wynik serwera już zawiera, nie daje duplikatu', () => {
    const state = run(loaded('ola', [a]), { type: 'begin', scope: 'ola' }, { type: 'update', scope: 'ola', update: upsert(b) })
    expect(run(state, { type: 'loaded', scope: 'ola', items: [b, a] }).items).toEqual([b, a])
  })

  it('usunięta w trakcie odświeżenia pozycja nie wraca z wynikiem sprzed usunięcia', () => {
    const state = run(loaded('ola', [a, b]), { type: 'begin', scope: 'ola' }, { type: 'update', scope: 'ola', update: without(1) })
    expect(state.items).toEqual([b])
    expect(run(state, { type: 'loaded', scope: 'ola', items: [a, b] }).items).toEqual([b])
  })

  it('zmiany naniesione w pierwszym wczytaniu też są odtwarzane na wyniku', () => {
    const state = run(initialListState<Row>('ola'), { type: 'update', scope: 'ola', update: upsert(a) })
    expect(state.status).toBe('loading')
    expect(run(state, { type: 'loaded', scope: 'ola', items: [b] }).items).toEqual([a, b])
  })

  it('zmiany spoza odświeżenia nie są odtwarzane drugi raz', () => {
    const state = run(loaded('ola', [a, b]), { type: 'update', scope: 'ola', update: without(1) })
    expect(state.pending).toEqual([])
    // Kolejne odświeżenie zwraca to, co serwer ma po usunięciu.
    expect(run(state, { type: 'begin', scope: 'ola' }, { type: 'loaded', scope: 'ola', items: [b, c] }).items).toEqual([b, c])
  })

  it('kolejne odświeżenie przed wynikiem zachowuje zmiany z całego okna', () => {
    const state = run(
      loaded('ola', [a]),
      { type: 'begin', scope: 'ola' },
      { type: 'update', scope: 'ola', update: upsert(b) },
      { type: 'begin', scope: 'ola' },
    )
    expect(run(state, { type: 'loaded', scope: 'ola', items: [a] }).items).toEqual([b, a])
  })

  it('nieudane odświeżenie zostawia wczytaną listę', () => {
    const state = run(loaded('ola', [a]), { type: 'begin', scope: 'ola' }, { type: 'failed', scope: 'ola' })
    expect(state).toMatchObject({ status: 'ready', items: [a], refreshing: false })
  })

  it('nieudane pierwsze wczytanie to error, a ponowna próba znów loading', () => {
    const failed = run(initialListState<Row>('ola'), { type: 'failed', scope: 'ola' })
    expect(failed).toMatchObject({ status: 'error', items: [] })
    expect(run(failed, { type: 'begin', scope: 'ola' })).toMatchObject({ status: 'loading', items: [] })
  })
})
