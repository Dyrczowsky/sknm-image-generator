import { describe, expect, it } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import { MARK, toggleMark } from '../richText'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import type { EditorSnapshot } from '../snapshot/snapshot'
import { fakeSupabase } from '../supabase/fakeClient'
import type { NewHistoryEntry } from '../types'
import { HISTORY_LIMIT, addHistoryEntry, deleteHistoryEntry, listHistory, newHistoryEntry } from './remoteHistory'

const COLUMNS = 'id, created_at, poster_key, title, subtitle, speaker, event_date, event_time, location, color_scheme, snapshot, source, image_url'
const ENTRY: NewHistoryEntry = {
  poster_key: 'wyklad', title: 'Tytuł', subtitle: '', speaker: 'dr X', event_date: '2031-03-04', event_time: '17:30', location: 'sala 1', color_scheme: 'czern~zloty', snapshot: null,
}
const STORED = { id: 7, created_at: '2031-03-01T10:00:00+00:00', ...ENTRY, source: 'app' as const, image_url: null }

const snap = (over: Partial<EditorSnapshot> = {}): EditorSnapshot => ({
  v: 2, poster_key: 'gosc', color_scheme: 'czern~zloty', lang: 'pl', export: { ...DEFAULT_EXPORT_SETTINGS },
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

  it('wąskie kolumny dostają czysty tekst, snapshot zachowuje formatowanie', () => {
    const title = toggleMark('Ala', 0, 3, MARK.bold)
    const snapshot = snap({ form: { ...EMPTY_FORM, title, graphics: [], photos: {} } })
    const entry = newHistoryEntry(snapshot)
    expect(entry.title).toBe('Ala')
    expect(entry.snapshot).toBe(snapshot)
    expect(snapshot.form.title).toBe(title)
    expect(snapshot.form.title).toContain('\uE000')
  })

  it('długie teksty: wąskie kolumny przycięte do limitów bazy, snapshot bez zmian', () => {
    const long = 'ą'.repeat(499) + '😀' + 'x'.repeat(100)
    const snapshot = snap({ form: { ...EMPTY_FORM, title: long, subtitle: long, speaker: long, location: long, graphics: [], photos: {} } })
    const entry = newHistoryEntry(snapshot)
    // Emoji to jeden znak (`char_length`), więc mieści się jako 500. znak.
    expect(entry.subtitle).toBe('ą'.repeat(499) + '😀')
    expect(entry.title).toBe(entry.subtitle)
    expect(Array.from(entry.speaker)).toHaveLength(200)
    expect(Array.from(entry.location)).toHaveLength(200)
    expect(entry.snapshot).toBe(snapshot)
    expect(snapshot.form.subtitle).toBe(long)
  })

  it('brak kolorystyki → null', () => {
    expect(newHistoryEntry(snap({ color_scheme: null })).color_scheme).toBeNull()
  })
})

describe('listHistory', () => {
  it('zwraca źródło wpisu i link do obrazu (wpisy AI)', async () => {
    const ai = { ...STORED, id: 8, source: 'ai' as const, image_url: 'https://x.supabase.co/storage/v1/object/public/sknm-ai-images/2031-03-01/a.png' }
    const { client } = fakeSupabase({ data: [ai, STORED] })
    const list = await listHistory(client)
    expect(list.map((e) => e.source)).toEqual(['ai', 'app'])
    expect(list[0].image_url).toBe(ai.image_url)
  })

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

const LEGACY = 'id, created_at, poster_key, title, subtitle, speaker, event_date, event_time, location, color_scheme, snapshot'
const { source: _s, image_url: _i, ...LEGACY_ROW } = STORED
const missing = [
  { code: '42703', message: 'column sknm_poster_history.source does not exist' },
  { code: 'PGRST204', message: "Could not find the 'image_url' column of 'sknm_poster_history' in the schema cache" },
  { message: 'column "source" does not exist' },
]

describe('brak kolumn source/image_url (aplikacja przed migracją)', () => {
  it.each(missing)('listHistory ponawia ze starą listą kolumn i uzupełnia domyślne', async (error) => {
    const { client, queries } = fakeSupabase([{ error }, { data: [LEGACY_ROW] }])
    expect(await listHistory(client)).toEqual([STORED])
    expect(queries).toHaveLength(2)
    expect(queries[1]).toContainEqual(['select', LEGACY])
  })

  it.each(missing)('addHistoryEntry ponawia ze starą listą kolumn', async (error) => {
    const { client, queries } = fakeSupabase([{ error }, { data: LEGACY_ROW }])
    expect(await addHistoryEntry(client, ENTRY)).toEqual(STORED)
    expect(queries[1]).toContainEqual(['select', LEGACY])
  })

  it('ponawia tylko raz: błąd ponowienia jest zgłaszany', async () => {
    const { client, queries } = fakeSupabase([{ error: missing[0] }, { error: { message: 'boom' } }])
    await expect(listHistory(client)).rejects.toThrow('boom')
    expect(queries).toHaveLength(2)
  })

  it('inny błąd nie wywołuje ponowienia', async () => {
    const { client, queries } = fakeSupabase({ error: { message: 'permission denied', code: '42501' } })
    await expect(listHistory(client)).rejects.toThrow('permission denied')
    expect(queries).toHaveLength(1)
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
