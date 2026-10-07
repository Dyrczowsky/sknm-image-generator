import { describe, expect, it } from 'vitest'
import { fakeSupabase } from '../supabase/fakeClient'
import { NOTES_LIMIT, addNote, deleteNote, listNotes, sortNotes, updateNote } from './remoteNotes'
import type { Note } from './remoteNotes'

const COLUMNS = 'id, created_at, author_email, text, done'
const note = (id: number, created_at: string, done = false): Note => ({ id, created_at, author_email: 'a@b.pl', text: `Notatka ${id}`, done })

describe('sortNotes', () => {
  it('otwarte przed zrobionymi, w grupach od najnowszej; nie mutuje wejścia', () => {
    const input = [note(1, '2031-01-01T10:00:00Z'), note(2, '2031-01-03T10:00:00Z', true), note(3, '2031-01-02T10:00:00Z'), note(4, '2031-01-04T10:00:00Z', true)]
    expect(sortNotes(input).map((n) => n.id)).toEqual([3, 1, 4, 2])
    expect(input.map((n) => n.id)).toEqual([1, 2, 3, 4])
  })

  it('ta sama data → wyższe id pierwsze', () => {
    expect(sortNotes([note(1, '2031-01-01T10:00:00Z'), note(2, '2031-01-01T10:00:00Z')]).map((n) => n.id)).toEqual([2, 1])
  })
})

describe('listNotes', () => {
  it('czyta notatki: otwarte najpierw, potem od najnowszej', async () => {
    const rows = [note(1, '2031-01-01T10:00:00Z')]
    const { client, queries } = fakeSupabase({ data: rows })
    expect(await listNotes(client)).toEqual(rows)
    expect(queries).toEqual([[
      ['from', 'sknm_notes'],
      ['select', COLUMNS],
      ['order', 'done', { ascending: true }],
      ['order', 'created_at', { ascending: false }],
      ['order', 'id', { ascending: false }],
      ['limit', NOTES_LIMIT],
    ]])
  })

  it('błąd Supabase → wyjątek', async () => {
    const { client } = fakeSupabase({ error: { message: 'permission denied' } })
    await expect(listNotes(client)).rejects.toThrow('permission denied')
  })
})

describe('zmiany notatek', () => {
  it('addNote wysyła samą treść - autora i datę uzupełnia baza', async () => {
    const stored = note(5, '2031-01-01T10:00:00Z')
    const { client, queries } = fakeSupabase({ data: stored })
    expect(await addNote(client, 'Kupić taśmę')).toEqual(stored)
    expect(queries).toEqual([[['from', 'sknm_notes'], ['insert', { text: 'Kupić taśmę' }], ['select', COLUMNS], ['single']]])
  })

  it('updateNote zmienia wskazaną notatkę i zwraca zapisany wiersz', async () => {
    const stored = note(5, '2031-01-01T10:00:00Z', true)
    const { client, queries } = fakeSupabase({ data: stored })
    expect(await updateNote(client, 5, { done: true })).toEqual(stored)
    expect(queries).toEqual([[['from', 'sknm_notes'], ['update', { done: true }], ['eq', 'id', 5], ['select', COLUMNS], ['single']]])
  })

  it('deleteNote usuwa po id', async () => {
    const { client, queries } = fakeSupabase()
    await deleteNote(client, 5)
    expect(queries).toEqual([[['from', 'sknm_notes'], ['delete'], ['eq', 'id', 5]]])
  })

  it('błąd Supabase → wyjątek w każdej zmianie', async () => {
    const { client } = fakeSupabase({ error: { message: 'boom' } })
    await expect(addNote(client, 'x')).rejects.toThrow('boom')
    await expect(updateNote(client, 1, { text: 'y' })).rejects.toThrow('boom')
    await expect(deleteNote(client, 1)).rejects.toThrow('boom')
  })
})
