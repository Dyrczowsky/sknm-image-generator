import { describe, expect, it } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import type { EditorSnapshot } from '../snapshot/snapshot'
import type { ProjectBinding } from './syncState'
import { WORKSPACE_KEY, createWorkspaceStore } from './workspaceStore'

const LAYOUTS = ['wyklad', 'gosc']
const REF = `${'a'.repeat(64)}.png`
const SNAPSHOT: EditorSnapshot = {
  v: 1, poster_key: 'wyklad', color_scheme: 'czern~zloty', lang: 'en',
  export: { medium: 'social', format: 'a3', orientation: 'landscape', fileType: 'pdf' },
  form: { ...EMPTY_FORM, title: 'Wykład', titleScale: 1.2, graphics: [REF], photos: { speaker: [{ asset: REF, x: 10, y: 90 }] } },
}
const BINDING: ProjectBinding = { id: 7, name: 'Wykład', ownerId: 'ola', revision: 3 }

function memory(initial?: unknown) {
  const map = new Map<string, unknown>()
  if (initial !== undefined) map.set(WORKSPACE_KEY, initial)
  const store = createWorkspaceStore({
    get: async (key) => map.get(key),
    set: async (key, value) => void map.set(key, value),
    del: async (key) => void map.delete(key),
  })
  return { store, map }
}

describe('createWorkspaceStore', () => {
  it('brak wpisu', async () => {
    expect(await memory().store.read(LAYOUTS)).toEqual({ kind: 'absent' })
  })

  it('zapisuje pod kluczem sknm-workspace i odczytuje to samo', async () => {
    const { store, map } = memory()
    await store.write({ snapshot: SNAPSHOT, project: BINDING, dirty: true })
    expect([...map.keys()]).toEqual(['sknm-workspace'])
    expect(await store.read(LAYOUTS)).toEqual({ kind: 'ok', workspace: { snapshot: SNAPSHOT, project: BINDING, dirty: true } })
  })

  it('wersja robocza bez projektu', async () => {
    const { store } = memory()
    await store.write({ snapshot: SNAPSHOT, project: null, dirty: false })
    expect(await store.read(LAYOUTS)).toEqual({ kind: 'ok', workspace: { snapshot: SNAPSHOT, project: null, dirty: false } })
  })

  it('zapis nie zawiera obrazów ani nadmiarowych pól', async () => {
    const { store, map } = memory()
    await store.write({ snapshot: SNAPSHOT, project: BINDING, dirty: false, extra: 1 } as never)
    expect(Object.keys(map.get(WORKSPACE_KEY) as object).sort()).toEqual(['dirty', 'project', 'snapshot'])
    expect(JSON.stringify(map.get(WORKSPACE_KEY))).not.toContain('data:')
  })

  it('braki w snapshocie uzupełnia wartościami domyślnymi (przez parseSnapshot)', async () => {
    const { store } = memory({ snapshot: { v: 1, poster_key: 'gosc', form: { title: 'X', titleScale: 99 } }, project: null, dirty: false })
    const result = await store.read(LAYOUTS)
    expect(result.kind).toBe('ok')
    if (result.kind !== 'ok') return
    expect(result.workspace.snapshot.export).toEqual(DEFAULT_EXPORT_SETTINGS)
    expect(result.workspace.snapshot.form.title).toBe('X')
    expect(result.workspace.snapshot.form.titleScale).toBe(1.3)
    expect(result.workspace.snapshot.form.showPkLogo).toBe(true)
  })

  it('odmawia kopii z nowszej wersji aplikacji i z nieznanym layoutem', async () => {
    expect(await memory({ snapshot: { ...SNAPSHOT, v: 2 }, project: BINDING, dirty: true }).store.read(LAYOUTS)).toEqual({ kind: 'rejected', reason: 'newer' })
    expect(await memory({ snapshot: { ...SNAPSHOT, poster_key: 'nowy' }, project: null, dirty: false }).store.read(LAYOUTS)).toEqual({ kind: 'rejected', reason: 'unknownLayout' })
  })

  it.each([['tekst'], [42], [[]], [{}], [{ snapshot: null }], [{ snapshot: { v: 'x' } }]])('śmieci %j: invalid', async (raw) => {
    expect(await memory(raw).store.read(LAYOUTS)).toEqual({ kind: 'rejected', reason: 'invalid' })
  })

  it('dirty jest prawdą tylko dla dokładnie `true`', async () => {
    for (const dirty of [undefined, null, 1, 'true', false]) {
      const result = await memory({ snapshot: SNAPSHOT, project: null, dirty }).store.read(LAYOUTS)
      expect(result).toMatchObject({ kind: 'ok', workspace: { dirty: false } })
    }
  })

  it.each([
    [{ ...BINDING, id: '7' }], [{ ...BINDING, id: 1.5 }], [{ ...BINDING, revision: null }], [{ ...BINDING, ownerId: '' }],
    [{ ...BINDING, name: 5 }], [{ id: 7 }], ['7'], [[]],
  ])('zepsute przypięcie %j: treść zostaje jako niezapisana wersja robocza', async (project) => {
    const result = await memory({ snapshot: SNAPSHOT, project, dirty: false }).store.read(LAYOUTS)
    expect(result).toEqual({ kind: 'ok', workspace: { snapshot: SNAPSHOT, project: null, dirty: true } })
  })

  it('przypięcie odczytuje tylko znane pola', async () => {
    const result = await memory({ snapshot: SNAPSHOT, project: { ...BINDING, secret: 'x' }, dirty: false }).store.read(LAYOUTS)
    expect(result).toEqual({ kind: 'ok', workspace: { snapshot: SNAPSHOT, project: BINDING, dirty: false } })
  })

  it('clear usuwa wpis', async () => {
    const { store, map } = memory({ snapshot: SNAPSHOT, project: null, dirty: false })
    await store.clear()
    expect(map.size).toBe(0)
  })
})
