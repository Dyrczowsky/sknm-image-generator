import { describe, expect, it } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import type { EditorSnapshot } from '../snapshot/snapshot'
import { fakeSupabase } from '../supabase/fakeClient'
import type { NewHistoryEntry } from '../types'
import { HISTORY_LIMIT, addHistoryEntry, deleteHistoryEntry, listHistory, newHistoryEntry } from './remoteHistory'

const COLUMNS = 'id, created_at, poster_key, title, subtitle, speaker, event_date, event_time, location, color_scheme, snapshot'
const ENTRY: NewHistoryEntry = {
  poster_key: 'wyklad', title: 'Tytuł', subtitle: '', speaker: 'dr X', event_date: '2031-03-04', event_time: '17:30', location: 'sala 1', color_scheme: 'czern~zloty', snapshot: null,
}
const STORED = { id: 7, created_at: '2031-03-01T10:00:00+00:00', ...ENTRY }

const snap = (over: Partial<EditorSnapshot> = {}): EditorSnapshot => ({
  v: 1, poster_key: 'gosc', color_scheme: 'czern~zloty', lang: 'pl', export: { ...DEFAULT_EXPORT_SETTINGS },
  form: { ...EMPTY_FORM, title: 'Tytuł', speaker: 'dr X', badge: 'PLAKIETKA', graphics: ['a.png'], photos: {} },
  ...over,
})

describe('newHistoryEntry', () => {
  it('wąskie kolumny z snapshotu plus cały snapshot', () => {
    const snapshot = snap()
    expect(newHistoryEntry(snapshot)).toEqual({
      poster_key: 'gosc', title: 'Tytuł', subtitle: '', speaker: 'dr X', event_date: '', event_time: '', location: '', color_scheme: 'czern~zloty', snapshot,
    })
  })

  it('brak kolorystyki → null', () => {
    expect(newHistoryEntry(snap({ color_scheme: null })).color_scheme).toBeNull()
  })
})

describe('listHistory', () => {
  it('czyta najnowsze wpisy z tabeli sknm_poster_history', async () => {
    const { client, queries } = fakeSupabase({ data: [STORED] })
    expect(await listHistory(client)).toEqual([STORED])
    expect(queries).toEqual([[
      ['from', 'sknm_poster_history'],
      ['select', COLUMNS],
      ['order', 'created_at', { ascending: false }],
      ['order', 'id', { ascending: false }],
      ['limit', HISTORY_LIMIT],
    ]])
  })

  it('błąd Supabase → wyjątek z jego komunikatem', async () => {
    const { client } = fakeSupabase({ error: { message: 'permission denied' } })
    await expect(listHistory(client)).rejects.toThrow('permission denied')
  })
})

describe('addHistoryEntry', () => {
  it('wstawia sam wpis (autora i datę uzupełnia baza) i zwraca zapisany wiersz', async () => {
    const { client, queries } = fakeSupabase({ data: STORED })
    expect(await addHistoryEntry(client, ENTRY)).toEqual(STORED)
    expect(queries).toEqual([[['from', 'sknm_poster_history'], ['insert', ENTRY], ['select', COLUMNS], ['single']]])
  })

  it('błąd Supabase → wyjątek', async () => {
    const { client } = fakeSupabase({ error: { message: 'row violates policy' } })
    await expect(addHistoryEntry(client, ENTRY)).rejects.toThrow('row violates policy')
  })
})

describe('deleteHistoryEntry', () => {
  it('usuwa wpis po id', async () => {
    const { client, queries } = fakeSupabase()
    await deleteHistoryEntry(client, 7)
    expect(queries).toEqual([[['from', 'sknm_poster_history'], ['delete'], ['eq', 'id', 7]]])
  })

  it('błąd Supabase → wyjątek', async () => {
    const { client } = fakeSupabase({ error: { message: 'boom' } })
    await expect(deleteHistoryEntry(client, 7)).rejects.toThrow('boom')
  })
})
