import { describe, expect, it } from 'vitest'
import { fakeSupabase } from '../supabase/fakeClient'
import {
  PROJECTS_LIMIT,
  PROJECT_NAME_MAX,
  ProjectConflictError,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  projectNameFrom,
  renameProject,
  saveProject,
  setProjectShared,
} from './remoteProjects'
import type { ProjectRow } from './remoteProjects'

const COLUMNS = 'id, created_at, updated_at, owner, owner_email, name, shared, revision, snapshot'
const row = (id: number, patch: Partial<ProjectRow> = {}): ProjectRow => ({
  id,
  created_at: '2031-01-01T10:00:00Z',
  updated_at: '2031-01-02T10:00:00Z',
  owner: 'u1',
  owner_email: 'a@b.pl',
  name: `Projekt ${id}`,
  shared: false,
  revision: 1,
  snapshot: { v: 1 },
  ...patch,
})

describe('listProjects', () => {
  it('czyta własne i udostępnione od ostatnio zmienionego', async () => {
    const rows = [row(1)]
    const { client, queries } = fakeSupabase({ data: rows })
    expect(await listProjects(client)).toEqual(rows)
    expect(queries).toEqual([[
      ['from', 'sknm_projects'],
      ['select', COLUMNS],
      ['order', 'updated_at', { ascending: false }],
      ['limit', PROJECTS_LIMIT],
    ]])
  })

  it('błąd Supabase → Error z komunikatem', async () => {
    const { client } = fakeSupabase({ error: { message: 'denied' } })
    await expect(listProjects(client)).rejects.toThrow('denied')
  })
})

describe('getProject', () => {
  it('czyta po id', async () => {
    const { client, queries } = fakeSupabase({ data: row(3) })
    expect(await getProject(client, 3)).toEqual(row(3))
    expect(queries).toEqual([[['from', 'sknm_projects'], ['select', COLUMNS], ['eq', 'id', 3], ['maybeSingle']]])
  })

  it('brak wiersza → null', async () => {
    const { client } = fakeSupabase({ data: null })
    expect(await getProject(client, 3)).toBeNull()
  })

  it('błąd → wyjątek', async () => {
    const { client } = fakeSupabase({ error: { message: 'boom' } })
    await expect(getProject(client, 3)).rejects.toThrow('boom')
  })
})

describe('createProject', () => {
  it('wstawia nazwę, snapshot i shared (domyślnie false)', async () => {
    const { client, queries } = fakeSupabase({ data: row(4) })
    expect(await createProject(client, { name: 'Nowy', snapshot: { a: 1 } })).toEqual(row(4))
    expect(queries).toEqual([[
      ['from', 'sknm_projects'],
      ['insert', { name: 'Nowy', snapshot: { a: 1 }, shared: false }],
      ['select', COLUMNS],
      ['single'],
    ]])
  })

  it('przekazuje shared', async () => {
    const { client, queries } = fakeSupabase({ data: row(4) })
    await createProject(client, { name: 'Nowy', snapshot: {}, shared: true })
    expect(queries[0][1]).toEqual(['insert', { name: 'Nowy', snapshot: {}, shared: true }])
  })

  it('błąd → wyjątek', async () => {
    const { client } = fakeSupabase({ error: { message: 'boom' } })
    await expect(createProject(client, { name: 'x', snapshot: {} })).rejects.toThrow('boom')
  })
})

describe('saveProject', () => {
  it('zapisuje snapshot przy wczytanej rewizji i zwraca wiersz z nową', async () => {
    const saved = row(5, { revision: 8 })
    const { client, queries } = fakeSupabase({ data: saved })
    expect(await saveProject(client, 5, 7, { a: 1 })).toEqual(saved)
    expect(queries).toEqual([[
      ['from', 'sknm_projects'],
      ['update', { snapshot: { a: 1 } }],
      ['eq', 'id', 5],
      ['eq', 'revision', 7],
      ['select', COLUMNS],
      ['maybeSingle'],
    ]])
  })

  it('brak wiersza → ProjectConflictError', async () => {
    const { client } = fakeSupabase({ data: null })
    const failure = saveProject(client, 5, 7, {})
    await expect(failure).rejects.toBeInstanceOf(ProjectConflictError)
    await expect(failure).rejects.toBeInstanceOf(Error)
  })

  it('błąd Supabase → zwykły Error, nie konflikt', async () => {
    const { client } = fakeSupabase({ error: { message: 'boom' } })
    const failure = saveProject(client, 5, 7, {})
    await expect(failure).rejects.toThrow('boom')
    await expect(failure).rejects.not.toBeInstanceOf(ProjectConflictError)
  })
})

describe('zmiany bez snapshotu', () => {
  it('renameProject', async () => {
    const { client, queries } = fakeSupabase({ data: row(5, { name: 'Inna' }) })
    expect((await renameProject(client, 5, 'Inna')).name).toBe('Inna')
    expect(queries).toEqual([[['from', 'sknm_projects'], ['update', { name: 'Inna' }], ['eq', 'id', 5], ['select', COLUMNS], ['single']]])
  })

  it('setProjectShared', async () => {
    const { client, queries } = fakeSupabase({ data: row(5, { shared: true }) })
    expect((await setProjectShared(client, 5, true)).shared).toBe(true)
    expect(queries).toEqual([[['from', 'sknm_projects'], ['update', { shared: true }], ['eq', 'id', 5], ['select', COLUMNS], ['single']]])
  })

  it('deleteProject', async () => {
    const { client, queries } = fakeSupabase()
    await deleteProject(client, 5)
    expect(queries).toEqual([[['from', 'sknm_projects'], ['delete'], ['eq', 'id', 5]]])
  })

  it('błąd → wyjątek w każdej zmianie', async () => {
    const { client } = fakeSupabase({ error: { message: 'boom' } })
    await expect(renameProject(client, 1, 'x')).rejects.toThrow('boom')
    await expect(setProjectShared(client, 1, true)).rejects.toThrow('boom')
    await expect(deleteProject(client, 1)).rejects.toThrow('boom')
  })
})

describe('projectNameFrom', () => {
  it('przycina białe znaki', () => expect(projectNameFrom('  Plakat  ')).toBe('Plakat'))
  it('pusty lub same spacje → Bez tytułu', () => {
    expect(projectNameFrom('')).toBe('Bez tytułu')
    expect(projectNameFrom('   ')).toBe('Bez tytułu')
  })
  it('ucina do limitu', () => {
    expect(projectNameFrom('a'.repeat(PROJECT_NAME_MAX + 30))).toHaveLength(PROJECT_NAME_MAX)
  })
  it('po cięciu nie zostawia końcowych spacji', () => {
    const name = projectNameFrom('a'.repeat(PROJECT_NAME_MAX - 1) + '  b')
    expect(name).toBe('a'.repeat(PROJECT_NAME_MAX - 1))
  })
})
