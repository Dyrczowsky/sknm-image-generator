import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import { ProjectConflictError } from '../projects/remoteProjects'
import type { ProjectRow } from '../projects/remoteProjects'
import type { EditorSnapshot } from '../snapshot/snapshot'
import { LOCAL_SAVE_DELAY_MS, RETRY_DELAY_MS, SYNC_DELAY_MS, createWorkspaceEngine } from './syncEngine'
import type { EngineState } from './syncEngine'
import type { ProjectBinding, Workspace } from './syncState'

const snap = (title: string): EditorSnapshot => ({
  v: 1, poster_key: 'wyklad', color_scheme: null, lang: 'pl', export: DEFAULT_EXPORT_SETTINGS,
  form: { ...EMPTY_FORM, graphics: [], photos: {}, title },
})
const BINDING: ProjectBinding = { id: 7, name: 'Wykład', ownerId: 'ola', revision: 3 }
const rowOf = (snapshot: EditorSnapshot, patch: Partial<ProjectRow> = {}): ProjectRow => ({
  id: 7, created_at: '', updated_at: '', owner: 'ola', owner_email: 'ola@sknm.pl', name: 'Wykład', shared: false, revision: 4, snapshot, ...patch,
})

// Odroczona odpowiedź serwera - test decyduje, kiedy i jak się kończy.
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup() {
  const local: Workspace[] = []
  const states: EngineState[] = []
  const saved: ProjectRow[] = []
  const conflicts: number[] = []
  let revision = BINDING.revision
  const remote = {
    upload: vi.fn(async (_snapshot: EditorSnapshot) => {}),
    create: vi.fn(async (name: string, snapshot: EditorSnapshot) => rowOf(snapshot, { name, revision: 1 })),
    save: vi.fn(async (_id: number, _revision: number, snapshot: EditorSnapshot) => rowOf(snapshot, { revision: ++revision })),
  }
  const engine = createWorkspaceEngine({
    writeLocal: async (workspace) => void local.push(workspace),
    ...remote,
    onSaved: (row) => void saved.push(row),
    onChange: (state) => void states.push(state),
    onConflict: () => void conflicts.push(1),
  })
  // Wczytanie dokumentu i pierwszy snapshot z edytora (punkt odniesienia).
  const open = (workspace: Workspace) => {
    const epoch = engine.load(workspace)
    engine.observe(workspace.snapshot, JSON.stringify(workspace.snapshot), epoch)
    return epoch
  }
  const edit = (title: string, epoch: number) => engine.observe(snap(title), JSON.stringify(snap(title)), epoch)
  return { engine, remote, local, states, saved, conflicts, open, edit }
}

const lastLocal = (local: Workspace[]) => local[local.length - 1]

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('wersja robocza (bez projektu)', () => {
  it('pierwszy snapshot po wczytaniu nie jest edycją', async () => {
    const { engine, open, local } = setup()
    open({ snapshot: snap('A'), project: null, dirty: false })
    await vi.advanceTimersByTimeAsync(10_000)
    expect(engine.getState()).toEqual({ project: null, status: 'local', dirty: false })
    expect(lastLocal(local)).toEqual({ snapshot: snap('A'), project: null, dirty: false })
  })

  it('punktem odniesienia jest stan edytora, nie wczytany snapshot', async () => {
    const { engine, local } = setup()
    const epoch = engine.load({ snapshot: snap('A'), project: BINDING, dirty: false })
    // Edytor znormalizował stan (np. kolory) - to nie zmiana użytkownika.
    engine.observe(snap('A-znormalizowane'), 'x', epoch)
    expect(engine.getState().dirty).toBe(false)
    await vi.advanceTimersByTimeAsync(0)
    expect(lastLocal(local).snapshot).toEqual(snap('A-znormalizowane'))
    engine.observe(snap('A-znormalizowane'), 'x', epoch)
    expect(engine.getState().dirty).toBe(false)
  })

  it('zmiana zapisuje się lokalnie po 400 ms od ostatniej edycji i nie idzie do chmury', async () => {
    const { engine, open, edit, local, remote } = setup()
    const epoch = open({ snapshot: snap('A'), project: null, dirty: false })
    engine.setUser('ola')
    const before = local.length
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(LOCAL_SAVE_DELAY_MS - 1)
    edit('C', epoch)
    await vi.advanceTimersByTimeAsync(LOCAL_SAVE_DELAY_MS - 1)
    expect(local).toHaveLength(before)
    await vi.advanceTimersByTimeAsync(1)
    expect(local).toHaveLength(before + 1)
    expect(lastLocal(local)).toEqual({ snapshot: snap('C'), project: null, dirty: true })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.create).not.toHaveBeenCalled()
    expect(remote.save).not.toHaveBeenCalled()
    expect(engine.getState().status).toBe('local')
  })

  it('snapshot ze starszego numeru (render sprzed wczytania) jest pomijany', () => {
    const { engine, open, edit } = setup()
    const old = open({ snapshot: snap('A'), project: null, dirty: false })
    const epoch = engine.load({ snapshot: snap('B'), project: null, dirty: false })
    edit('A2', old)
    expect(engine.getState().dirty).toBe(false)
    // Dopiero snapshot z nowym numerem ustala punkt odniesienia.
    edit('B', epoch)
    expect(engine.getState().dirty).toBe(false)
    edit('B2', epoch)
    expect(engine.getState().dirty).toBe(true)
  })

  it('„Zapisz" bez zalogowania niczego nie wysyła', async () => {
    const { engine, open, remote } = setup()
    open({ snapshot: snap('A'), project: null, dirty: false })
    engine.setUser(null)
    expect(await engine.saveNow()).toBe('signedOut')
    expect(remote.create).not.toHaveBeenCalled()
  })

  it('pierwszy „Zapisz" wgrywa grafiki, tworzy projekt z nazwą z tytułu i przypina kopię', async () => {
    const { engine, open, remote, local, saved } = setup()
    open({ snapshot: snap('  Wykład o AI '), project: null, dirty: true })
    engine.setUser('ola')
    expect(await engine.saveNow()).toBe('saved')
    expect(remote.upload).toHaveBeenCalledWith(snap('  Wykład o AI '))
    expect(remote.upload.mock.invocationCallOrder[0]).toBeLessThan(remote.create.mock.invocationCallOrder[0])
    expect(remote.create).toHaveBeenCalledWith('Wykład o AI', snap('  Wykład o AI '))
    const project = { id: 7, name: 'Wykład o AI', ownerId: 'ola', revision: 1 }
    expect(engine.getState()).toEqual({ project, status: 'saved', dirty: false })
    expect(lastLocal(local)).toEqual({ snapshot: snap('  Wykład o AI '), project, dirty: false })
    expect(saved).toHaveLength(1)
  })

  it('pusty tytuł daje „Bez tytułu"', async () => {
    const { engine, open, remote } = setup()
    open({ snapshot: snap(''), project: null, dirty: false })
    engine.setUser('ola')
    await engine.saveNow()
    expect(remote.create.mock.calls[0][0]).toBe('Bez tytułu')
  })

  it('podwójny „Zapisz" tworzy jeden projekt', async () => {
    const { engine, open, remote } = setup()
    open({ snapshot: snap('A'), project: null, dirty: true })
    engine.setUser('ola')
    const results = await Promise.all([engine.saveNow(), engine.saveNow()])
    expect(results).toEqual(['saved', 'saved'])
    expect(remote.create).toHaveBeenCalledTimes(1)
  })

  it('nieudane utworzenie zostawia wersję roboczą', async () => {
    const { engine, open, remote } = setup()
    open({ snapshot: snap('A'), project: null, dirty: true })
    engine.setUser('ola')
    remote.create.mockRejectedValueOnce(new Error('sieć'))
    expect(await engine.saveNow()).toBe('failed')
    expect(engine.getState()).toEqual({ project: null, status: 'local', dirty: true })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.create).toHaveBeenCalledTimes(1)
  })

  it('nieudane wgranie grafik nie tworzy projektu', async () => {
    const { engine, open, remote } = setup()
    open({ snapshot: snap('A'), project: null, dirty: true })
    engine.setUser('ola')
    remote.upload.mockRejectedValueOnce(new Error('storage'))
    expect(await engine.saveNow()).toBe('failed')
    expect(remote.create).not.toHaveBeenCalled()
  })

  it('zmiany w trakcie tworzenia projektu idą potem autozapisem', async () => {
    const { engine, open, edit, remote } = setup()
    const epoch = open({ snapshot: snap('A'), project: null, dirty: true })
    engine.setUser('ola')
    const pending = deferred<ProjectRow>()
    remote.create.mockReturnValueOnce(pending.promise)
    const saving = engine.saveNow()
    await vi.advanceTimersByTimeAsync(0)
    expect(engine.getState().status).toBe('saving')
    edit('B', epoch)
    pending.resolve(rowOf(snap('A'), { revision: 1 }))
    await saving
    expect(engine.getState()).toMatchObject({ status: 'dirty', dirty: true })
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    expect(remote.save).toHaveBeenCalledWith(7, 1, snap('B'))
    expect(engine.getState()).toMatchObject({ status: 'saved', dirty: false })
  })

  it('flush wersji roboczej zapisuje lokalnie i niczego nie wysyła', async () => {
    const { engine, open, edit, local, remote } = setup()
    const epoch = open({ snapshot: snap('A'), project: null, dirty: false })
    edit('B', epoch)
    expect(await engine.flush()).toBe(true)
    expect(lastLocal(local).snapshot).toEqual(snap('B'))
    expect(remote.create).not.toHaveBeenCalled()
  })
})

describe('projekt w chmurze', () => {
  const bound = (dirty = false) => {
    const kit = setup()
    kit.engine.setUser('ola')
    const epoch = kit.open({ snapshot: snap('A'), project: BINDING, dirty })
    return { ...kit, epoch }
  }

  it('otwarty przez właściciela: zapisano, bez żądań', async () => {
    const { engine, remote } = bound()
    expect(engine.getState()).toEqual({ project: BINDING, status: 'saved', dirty: false })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).not.toHaveBeenCalled()
  })

  it('autozapis 2 s po ostatniej zmianie, z wersją, którą kopia zna', async () => {
    const { engine, edit, epoch, remote, local } = bound()
    edit('B', epoch)
    expect(engine.getState().status).toBe('dirty')
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS - 1)
    edit('C', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS - 1)
    expect(remote.save).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(remote.upload).toHaveBeenCalledWith(snap('C'))
    expect(remote.save).toHaveBeenCalledTimes(1)
    expect(remote.save).toHaveBeenCalledWith(7, 3, snap('C'))
    expect(engine.getState()).toEqual({ project: { ...BINDING, revision: 4 }, status: 'saved', dirty: false })
    expect(lastLocal(local)).toEqual({ snapshot: snap('C'), project: { ...BINDING, revision: 4 }, dirty: false })
  })

  it('kopia lokalna oznacza zmiany jako niewysłane, zanim pójdą do chmury', async () => {
    const { edit, epoch, local } = bound()
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(LOCAL_SAVE_DELAY_MS)
    expect(lastLocal(local)).toEqual({ snapshot: snap('B'), project: BINDING, dirty: true })
  })

  it('jedno żądanie naraz: zmiana w trakcie zapisu czeka i idzie z nową wersją', async () => {
    const { engine, edit, epoch, remote } = bound()
    const first = deferred<ProjectRow>()
    remote.save.mockReturnValueOnce(first.promise)
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    expect(engine.getState().status).toBe('saving')
    edit('C', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS * 3)
    expect(remote.save).toHaveBeenCalledTimes(1)
    first.resolve(rowOf(snap('B'), { revision: 4 }))
    await vi.advanceTimersByTimeAsync(0)
    expect(engine.getState()).toMatchObject({ status: 'dirty', dirty: true })
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    expect(remote.save).toHaveBeenCalledTimes(2)
    expect(remote.save).toHaveBeenLastCalledWith(7, 4, snap('C'))
    expect(engine.getState()).toMatchObject({ status: 'saved', dirty: false })
  })

  it('błąd zapisu: status błędu, ponowienie po chwili bez udziału użytkownika', async () => {
    const { engine, edit, epoch, remote } = bound()
    remote.save.mockRejectedValueOnce(new Error('sieć'))
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    expect(engine.getState()).toMatchObject({ status: 'error', dirty: true, project: BINDING })
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS)
    expect(remote.save).toHaveBeenCalledTimes(2)
    expect(engine.getState()).toMatchObject({ status: 'saved', dirty: false })
  })

  it('konflikt wersji zatrzymuje autozapis do decyzji użytkownika', async () => {
    const { engine, edit, epoch, remote, conflicts } = bound()
    remote.save.mockRejectedValueOnce(new ProjectConflictError())
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    expect(engine.getState()).toMatchObject({ status: 'conflict', dirty: true, project: BINDING })
    expect(conflicts).toHaveLength(1)
    edit('C', epoch)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).toHaveBeenCalledTimes(1)
    expect(await engine.saveNow()).toBe('blocked')
    expect(await engine.flush()).toBe(false)
  })

  it('konflikt z własnym zapisem (ta sama treść w chmurze) znika bez pytania', async () => {
    const { engine, edit, epoch, remote, local } = bound()
    remote.save.mockRejectedValueOnce(new ProjectConflictError())
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    expect(engine.getState().status).toBe('conflict')
    expect(engine.reconcileRemote(rowOf(snap('B'), { revision: 4 })).kind).toBe('keep')
    expect(engine.getState()).toEqual({ project: { ...BINDING, revision: 4 }, status: 'saved', dirty: false })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).toHaveBeenCalledTimes(1)
    expect(lastLocal(local)).toEqual({ snapshot: snap('B'), project: { ...BINDING, revision: 4 }, dirty: false })
  })

  it('konflikt z cudzą zmianą zostaje konfliktem', async () => {
    const { engine, edit, epoch, remote } = bound()
    remote.save.mockRejectedValueOnce(new ProjectConflictError())
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    expect(engine.reconcileRemote(rowOf(snap('cudze'), { revision: 4 })).kind).toBe('conflict')
    expect(engine.getState()).toMatchObject({ status: 'conflict', dirty: true, project: { revision: 3 } })
  })

  it('„Nadpisz": bieżąca treść idzie na wersję z chmury', async () => {
    const { engine, edit, epoch, remote } = bound()
    remote.save.mockRejectedValueOnce(new ProjectConflictError())
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    remote.save.mockImplementationOnce(async (_id, _revision, snapshot) => rowOf(snapshot, { revision: 10 }))
    expect(await engine.overwrite(rowOf(snap('cudze'), { revision: 9, name: 'Inna nazwa' }))).toBe(true)
    expect(remote.save).toHaveBeenLastCalledWith(7, 9, snap('B'))
    expect(engine.getState()).toMatchObject({ status: 'saved', dirty: false, project: { revision: 10 } })
  })

  it('„Nadpisz", gdy projektu już nie ma: treść zostaje wersją roboczą', async () => {
    const { engine, edit, epoch, remote, local } = bound()
    remote.save.mockRejectedValueOnce(new ProjectConflictError())
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    expect(await engine.overwrite(null)).toBe(false)
    expect(engine.getState()).toEqual({ project: null, status: 'local', dirty: true })
    await vi.advanceTimersByTimeAsync(0)
    expect(lastLocal(local)).toEqual({ snapshot: snap('B'), project: null, dirty: true })
  })

  it('„Zapisz" bez zmian nie wysyła żądania', async () => {
    const { engine, remote } = bound()
    expect(await engine.saveNow()).toBe('saved')
    expect(remote.save).not.toHaveBeenCalled()
  })

  it('„Zapisz" wysyła od razu, bez czekania na autozapis', async () => {
    const { engine, edit, epoch, remote } = bound()
    edit('B', epoch)
    expect(await engine.saveNow()).toBe('saved')
    expect(remote.save).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).toHaveBeenCalledTimes(1)
  })

  it('flush czeka na trwający zapis i dosyła zmiany, które przyszły po nim', async () => {
    const { engine, edit, epoch, remote } = bound()
    const first = deferred<ProjectRow>()
    remote.save.mockReturnValueOnce(first.promise)
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    edit('C', epoch)
    const flushed = engine.flush()
    first.resolve(rowOf(snap('B'), { revision: 4 }))
    expect(await flushed).toBe(true)
    expect(remote.save).toHaveBeenLastCalledWith(7, 4, snap('C'))
    expect(engine.getState()).toMatchObject({ status: 'saved', dirty: false })
  })

  it('flush zwraca fałsz, gdy zapis się nie udaje', async () => {
    const { engine, edit, epoch, remote } = bound()
    remote.save.mockRejectedValue(new Error('sieć'))
    edit('B', epoch)
    expect(await engine.flush()).toBe(false)
    expect(engine.getState().dirty).toBe(true)
  })

  it('flush bez zmian niczego nie wysyła', async () => {
    const { engine, remote } = bound()
    expect(await engine.flush()).toBe(true)
    expect(remote.save).not.toHaveBeenCalled()
  })

  it('flushSoon zapisuje lokalnie i wysyła od razu', async () => {
    const { engine, edit, epoch, remote, local } = bound()
    edit('B', epoch)
    const before = local.length
    engine.flushSoon()
    await vi.advanceTimersByTimeAsync(0)
    expect(local.length).toBeGreaterThan(before)
    expect(remote.save).toHaveBeenCalledWith(7, 3, snap('B'))
  })

  it('wynik zapisu poprzedniego dokumentu nie dotyka nowo wczytanego', async () => {
    const { engine, edit, epoch, remote, open, saved } = bound()
    const pending = deferred<ProjectRow>()
    remote.save.mockReturnValueOnce(pending.promise)
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    open({ snapshot: snap('Inny'), project: null, dirty: false })
    pending.resolve(rowOf(snap('B'), { revision: 4 }))
    await vi.advanceTimersByTimeAsync(0)
    expect(engine.getState()).toEqual({ project: null, status: 'local', dirty: false })
    // Lista projektów nadal dowiaduje się o zapisanym wierszu.
    expect(saved).toHaveLength(1)
  })

  it('odpięcie w trakcie zapisu: treść zostaje wersją roboczą, a edycje nadal są widziane', async () => {
    const { engine, edit, epoch, remote } = bound()
    const pending = deferred<ProjectRow>()
    remote.save.mockReturnValueOnce(pending.promise)
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    engine.detach()
    pending.resolve(rowOf(snap('B'), { revision: 4 }))
    await vi.advanceTimersByTimeAsync(0)
    expect(engine.getState()).toEqual({ project: null, status: 'local', dirty: true })
    edit('C', epoch)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).toHaveBeenCalledTimes(1)
  })

  it('odpięcie w trakcie zapisu (np. projekt usunięto z listy): lista nie dostaje wiersza z powrotem', async () => {
    const { engine, edit, epoch, remote, saved } = bound()
    const pending = deferred<ProjectRow>()
    remote.save.mockReturnValueOnce(pending.promise)
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS)
    engine.detach()
    pending.resolve(rowOf(snap('B'), { revision: 4 }))
    await vi.advanceTimersByTimeAsync(0)
    expect(saved).toEqual([])
  })

  it('zmiana nazwy dotyczy tylko otwartego projektu', async () => {
    const { engine, local } = bound()
    engine.rename(8, 'Cudzy')
    expect(engine.getState().project?.name).toBe('Wykład')
    engine.rename(7, 'Nowa')
    expect(engine.getState().project?.name).toBe('Nowa')
    await vi.advanceTimersByTimeAsync(0)
    expect(lastLocal(local).project?.name).toBe('Nowa')
  })
})

describe('logowanie a przypięty projekt', () => {
  it('start przed poznaniem sesji: wstrzymany, zmiany tylko lokalnie', async () => {
    const { engine, open, edit, remote, local } = setup()
    const epoch = open({ snapshot: snap('A'), project: BINDING, dirty: false })
    expect(engine.getState().status).toBe('paused')
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).not.toHaveBeenCalled()
    expect(lastLocal(local)).toEqual({ snapshot: snap('B'), project: BINDING, dirty: true })
    expect(await engine.saveNow()).toBe('signedOut')
  })

  it('nikt nie jest zalogowany: wstrzymanie, flush zmian się nie udaje, flush bez zmian tak', async () => {
    const { engine, open, edit } = setup()
    const epoch = open({ snapshot: snap('A'), project: BINDING, dirty: false })
    expect(engine.setUser(null)).toBe('pause')
    expect(engine.getState().status).toBe('paused')
    expect(await engine.flush()).toBe(true)
    edit('B', epoch)
    expect(await engine.flush()).toBe(false)
  })

  it('zalogowany właściciel: wznowienie; samo logowanie niczego nie wysyła', async () => {
    const { engine, open, remote } = setup()
    open({ snapshot: snap('A'), project: BINDING, dirty: true })
    expect(engine.setUser('ola')).toBe('resume')
    expect(engine.getState().status).toBe('dirty')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).not.toHaveBeenCalled()
  })

  it('ta sama osoba zgłoszona drugi raz niczego nie zmienia', () => {
    const { engine, open } = setup()
    open({ snapshot: snap('A'), project: BINDING, dirty: false })
    expect(engine.setUser('ola')).toBe('resume')
    expect(engine.setUser('ola')).toBe('none')
  })

  it('inna osoba: odpięcie, treść zostaje niezapisaną wersją roboczą i nie idzie do chmury', async () => {
    const { engine, open, edit, remote, local } = setup()
    const epoch = open({ snapshot: snap('A'), project: BINDING, dirty: false })
    expect(engine.setUser('jan')).toBe('unbind')
    expect(engine.getState()).toEqual({ project: null, status: 'local', dirty: true })
    await vi.advanceTimersByTimeAsync(0)
    expect(lastLocal(local)).toEqual({ snapshot: snap('A'), project: null, dirty: true })
    edit('B', epoch)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).not.toHaveBeenCalled()
    expect(remote.create).not.toHaveBeenCalled()
  })

  it('wylogowanie w trakcie pracy wstrzymuje autozapis, ponowne logowanie właściciela go wznawia', async () => {
    const { engine, open, edit, remote } = setup()
    engine.setUser('ola')
    const epoch = open({ snapshot: snap('A'), project: BINDING, dirty: false })
    edit('B', epoch)
    expect(engine.setUser(null)).toBe('pause')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).not.toHaveBeenCalled()
    expect(engine.setUser('ola')).toBe('resume')
    expect(engine.getState().status).toBe('dirty')
    engine.retrySync()
    await vi.advanceTimersByTimeAsync(0)
    expect(remote.save).toHaveBeenCalledWith(7, 3, snap('B'))
  })

  it('wersja robocza: logowanie i wylogowanie niczego nie zmieniają', () => {
    const { engine, open } = setup()
    open({ snapshot: snap('A'), project: null, dirty: true })
    expect(engine.setUser('ola')).toBe('none')
    expect(engine.setUser(null)).toBe('none')
    expect(engine.setUser('jan')).toBe('none')
    expect(engine.getState()).toEqual({ project: null, status: 'local', dirty: true })
  })

  it('projekt otwarty, gdy właściciel jest już znany, od razu jest zsynchronizowany', () => {
    const { engine, open } = setup()
    engine.setUser('ola')
    open({ snapshot: snap('A'), project: BINDING, dirty: false })
    expect(engine.getState().status).toBe('saved')
  })
})

describe('porównanie z chmurą (reconcileRemote)', () => {
  const resumed = (dirty: boolean) => {
    const kit = setup()
    const epoch = kit.open({ snapshot: snap('A'), project: BINDING, dirty })
    kit.engine.setUser('ola')
    return { ...kit, epoch }
  }

  it('zmiany wysłane przed zamknięciem karty (ta sama treść, nowsza wersja): bez konfliktu i bez żądania', async () => {
    const { engine, remote, local } = resumed(true)
    expect(engine.reconcileRemote(rowOf(snap('A'), { revision: 4 })).kind).toBe('keep')
    expect(engine.getState()).toEqual({ project: { ...BINDING, revision: 4 }, status: 'saved', dirty: false })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).not.toHaveBeenCalled()
    expect(lastLocal(local)).toMatchObject({ project: { revision: 4 }, dirty: false })
  })

  it('ta sama wersja, bez zmian: zostaje, przejmuje nazwę z chmury', async () => {
    const { engine, remote } = resumed(false)
    expect(engine.reconcileRemote(rowOf(snap('A'), { revision: 3, name: 'Przemianowany' })).kind).toBe('keep')
    expect(engine.getState()).toEqual({ project: { ...BINDING, name: 'Przemianowany' }, status: 'saved', dirty: false })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).not.toHaveBeenCalled()
  })

  it('lokalne zmiany na tej samej wersji: wysyłka od razu', async () => {
    const { engine, remote } = resumed(true)
    expect(engine.reconcileRemote(rowOf(snap('stare'), { revision: 3 })).kind).toBe('push')
    await vi.advanceTimersByTimeAsync(0)
    expect(remote.save).toHaveBeenCalledWith(7, 3, snap('A'))
    expect(engine.getState()).toMatchObject({ status: 'saved', dirty: false })
  })

  it('lokalne zmiany, chmura poszła dalej: konflikt bez żądania', async () => {
    const { engine, remote } = resumed(true)
    expect(engine.reconcileRemote(rowOf(snap('cudze'), { revision: 5 })).kind).toBe('conflict')
    expect(engine.getState().status).toBe('conflict')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(remote.save).not.toHaveBeenCalled()
  })

  it('chmura poszła dalej, bez zmian: decyzja wraca do wołającego, stan zostaje', () => {
    const { engine } = resumed(false)
    const row = rowOf(snap('nowe'), { revision: 5 })
    expect(engine.reconcileRemote(row)).toEqual({ kind: 'applyRemote', row })
    expect(engine.getState()).toEqual({ project: BINDING, status: 'saved', dirty: false })
  })

  it('edycja między decyzją a wczytaniem zamienia „wczytaj z chmury" w konflikt', () => {
    const { engine, edit, epoch } = resumed(false)
    const row = rowOf(snap('nowe'), { revision: 5 })
    expect(engine.reconcileRemote(row).kind).toBe('applyRemote')
    edit('B', epoch)
    expect(engine.reconcileRemote(row).kind).toBe('conflict')
    expect(engine.getState().status).toBe('conflict')
  })

  it('wiersza nie ma: odpięcie', () => {
    const { engine } = resumed(false)
    expect(engine.reconcileRemote(null)).toEqual({ kind: 'drop' })
    expect(engine.getState()).toEqual({ project: null, status: 'local', dirty: true })
  })
})
