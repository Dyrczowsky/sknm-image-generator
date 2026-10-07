import { describe, expect, it } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import type { ProjectRow } from '../projects/remoteProjects'
import type { EditorSnapshot } from '../snapshot/snapshot'
import { afterSignOut, bindingOf, bootDecision, reconcileBinding, reduceSaveStatus, sameContent } from './syncState'
import type { ProjectBinding, SaveEvent, SaveStatus, Workspace } from './syncState'

const SNAPSHOT: EditorSnapshot = {
  v: 1, poster_key: 'wyklad', color_scheme: null, lang: 'pl', export: DEFAULT_EXPORT_SETTINGS,
  form: { ...EMPTY_FORM, graphics: [], photos: {}, title: 'Wykład' },
}
const BINDING: ProjectBinding = { id: 7, name: 'Wykład', ownerId: 'ola', revision: 3 }
const workspace = (patch: Partial<Workspace> = {}): Workspace => ({ snapshot: SNAPSHOT, project: BINDING, dirty: false, ...patch })
// Treść w chmurze inna niż lokalna - tak wygląda wiersz zmieniony gdzie indziej.
const OTHER: EditorSnapshot = { ...SNAPSHOT, form: { ...SNAPSHOT.form, title: 'Zmienione gdzie indziej' } }
const row = (patch: Partial<ProjectRow> = {}): ProjectRow => ({
  id: 7, created_at: '2031-01-01T10:00:00Z', updated_at: '2031-01-02T10:00:00Z', owner: 'ola', owner_email: 'ola@sknm.pl',
  name: 'Wykład', shared: false, revision: 3, snapshot: SNAPSHOT, ...patch,
})

const STATUSES: SaveStatus[] = ['local', 'saved', 'dirty', 'saving', 'error', 'conflict', 'paused']

// Pełna tabela: dla każdego zdarzenia status wynikowy z każdego z siedmiu statusów.
const table = (event: SaveEvent) => Object.fromEntries(STATUSES.map((status) => [status, reduceSaveStatus(status, event)]))
const all = (status: SaveStatus) => Object.fromEntries(STATUSES.map((from) => [from, status]))

describe('reduceSaveStatus', () => {
  it('opened: stan wynika wyłącznie z tego, co wczytano', () => {
    expect(table({ type: 'opened', bound: false, dirty: false, online: true })).toEqual(all('local'))
    expect(table({ type: 'opened', bound: false, dirty: true, online: false })).toEqual(all('local'))
    expect(table({ type: 'opened', bound: true, dirty: false, online: true })).toEqual(all('saved'))
    expect(table({ type: 'opened', bound: true, dirty: true, online: true })).toEqual(all('dirty'))
    expect(table({ type: 'opened', bound: true, dirty: false, online: false })).toEqual(all('paused'))
    expect(table({ type: 'opened', bound: true, dirty: true, online: false })).toEqual(all('paused'))
  })

  it('unbound: zawsze wersja robocza', () => {
    expect(table({ type: 'unbound' })).toEqual(all('local'))
  })

  it('edited: tylko „zapisano" przechodzi w „niezapisane zmiany"', () => {
    expect(table({ type: 'edited' })).toEqual({
      local: 'local', saved: 'dirty', dirty: 'dirty', saving: 'saving', error: 'error', conflict: 'conflict', paused: 'paused',
    })
  })

  it('saveStarted: zawsze „zapisywanie" (także pierwszy zapis i nadpisanie po konflikcie)', () => {
    expect(table({ type: 'saveStarted' })).toEqual(all('saving'))
  })

  it('saveSucceeded: liczy się tylko w trakcie zapisu', () => {
    const unchanged = { local: 'local', saved: 'saved', dirty: 'dirty', error: 'error', conflict: 'conflict', paused: 'paused' }
    expect(table({ type: 'saveSucceeded', dirty: false })).toEqual({ ...unchanged, saving: 'saved' })
    expect(table({ type: 'saveSucceeded', dirty: true })).toEqual({ ...unchanged, saving: 'dirty' })
  })

  it('saveFailed: błąd projektu albo powrót do wersji roboczej, gdy nie powstał', () => {
    const unchanged = { local: 'local', saved: 'saved', dirty: 'dirty', error: 'error', conflict: 'conflict', paused: 'paused' }
    expect(table({ type: 'saveFailed', bound: true })).toEqual({ ...unchanged, saving: 'error' })
    expect(table({ type: 'saveFailed', bound: false })).toEqual({ ...unchanged, saving: 'local' })
  })

  it('conflict: nie dotyczy wersji roboczej ani wstrzymanego projektu', () => {
    expect(table({ type: 'conflict' })).toEqual({
      local: 'local', saved: 'conflict', dirty: 'conflict', saving: 'conflict', error: 'conflict', conflict: 'conflict', paused: 'paused',
    })
  })

  it('paused: każdy przypięty projekt staje, wersja robocza nie', () => {
    expect(table({ type: 'paused' })).toEqual({ ...all('paused'), local: 'local' })
  })

  it('resumed: wznawia tylko wstrzymany projekt', () => {
    const unchanged = { local: 'local', saved: 'saved', dirty: 'dirty', saving: 'saving', error: 'error', conflict: 'conflict' }
    expect(table({ type: 'resumed', dirty: false })).toEqual({ ...unchanged, paused: 'saved' })
    expect(table({ type: 'resumed', dirty: true })).toEqual({ ...unchanged, paused: 'dirty' })
  })

  it('zmiana w trakcie zapisu nie gubi się: saving → (edited) → saving → dirty', () => {
    const afterEdit = reduceSaveStatus('saving', { type: 'edited' })
    expect(reduceSaveStatus(afterEdit, { type: 'saveSucceeded', dirty: true })).toBe('dirty')
  })
})

describe('reconcileBinding', () => {
  // Wersja robocza × {nikt, właściciel dawnego projektu, ktoś inny} × {czysta, zmieniona}.
  it.each([
    [null, false], [null, true], ['ola', false], ['ola', true], ['jan', false], ['jan', true],
  ] as const)('wersja robocza: logowanie %s (dirty=%s) niczego nie zmienia', (userId, dirty) => {
    const local = workspace({ project: null, dirty })
    expect(reconcileBinding(local, userId)).toEqual({ action: 'none', workspace: local })
  })

  it.each([false, true])('projekt, nikt nie jest zalogowany (dirty=%s): wstrzymanie, przypięcie i zmiany zostają', (dirty) => {
    const local = workspace({ dirty })
    expect(reconcileBinding(local, null)).toEqual({ action: 'pause', workspace: local })
  })

  it.each([false, true])('projekt, zalogowany właściciel (dirty=%s): wznowienie bez zmian w kopii', (dirty) => {
    const local = workspace({ dirty })
    expect(reconcileBinding(local, 'ola')).toEqual({ action: 'resume', workspace: local })
  })

  it.each([false, true])('projekt, zalogował się ktoś inny (dirty=%s): treść zostaje jako niezapisana wersja robocza', (dirty) => {
    const result = reconcileBinding(workspace({ dirty }), 'jan')
    expect(result.action).toBe('unbind')
    expect(result.workspace).toEqual({ snapshot: SNAPSHOT, project: null, dirty: true })
  })

  it('nie zmienia podanej kopii', () => {
    const local = workspace()
    reconcileBinding(local, 'jan')
    expect(local.project).toBe(BINDING)
  })

  it('wylogowanie i ponowne logowanie tej samej osoby: wstrzymanie, potem wznowienie', () => {
    const paused = reconcileBinding(workspace({ dirty: true }), null)
    expect(reconcileBinding(paused.workspace, 'ola').action).toBe('resume')
  })

  it('wylogowanie, a potem inna osoba: odpięcie', () => {
    const paused = reconcileBinding(workspace(), null)
    expect(reconcileBinding(paused.workspace, 'jan').action).toBe('unbind')
  })
})

describe('afterSignOut', () => {
  it.each([
    [false, false], [false, true], [true, false], [true, true],
  ])('wersja robocza (dirty=%s, flushed=%s) zostaje bez zmian', (dirty, flushed) => {
    expect(afterSignOut(workspace({ project: null, dirty }), flushed)).toBe('keep')
  })

  it('projekt zapisany przed wylogowaniem: pusty edytor', () => {
    expect(afterSignOut(workspace(), true)).toBe('blank')
    expect(afterSignOut(workspace({ dirty: true }), true)).toBe('blank')
  })

  it('zapis się nie udał: treść zostaje jako wersja robocza', () => {
    expect(afterSignOut(workspace({ dirty: true }), false)).toBe('detach')
    expect(afterSignOut(workspace(), false)).toBe('detach')
  })
})

describe('bootDecision', () => {
  // Pełna tabela: {bez zmian, zmiany} × {ta sama wersja, inna} × {ta sama treść, inna}.
  it.each([
    [false, 3, 'same', 'keep'],
    [false, 3, 'other', 'keep'],
    [false, 4, 'same', 'keep'],
    [false, 4, 'other', 'applyRemote'],
    [true, 3, 'same', 'keep'],
    [true, 3, 'other', 'push'],
    [true, 4, 'same', 'keep'],
    [true, 4, 'other', 'conflict'],
  ] as const)('dirty=%s, wersja w chmurze %i (lokalna 3), treść %s → %s', (dirty, revision, content, kind) => {
    const remote = row({ revision, snapshot: content === 'same' ? SNAPSHOT : OTHER })
    expect(bootDecision(workspace({ dirty }), remote).kind).toBe(kind)
  })

  it('ta sama wersja, brak zmian: nic do zrobienia', () => {
    expect(bootDecision(workspace(), row())).toEqual({ kind: 'keep', name: 'Wykład', revision: 3 })
  })

  it('chmura poszła dalej, lokalnie bez zmian: wczytaj wersję z chmury', () => {
    const remote = row({ revision: 4, snapshot: OTHER })
    expect(bootDecision(workspace(), remote)).toEqual({ kind: 'applyRemote', row: remote })
  })

  it('lokalne zmiany na tej samej wersji: wyślij', () => {
    expect(bootDecision(workspace({ dirty: true }), row({ snapshot: OTHER }))).toEqual({ kind: 'push', name: 'Wykład' })
  })

  it('lokalne zmiany, a chmura poszła dalej: konflikt (nikt nie wygrywa po cichu)', () => {
    expect(bootDecision(workspace({ dirty: true }), row({ revision: 4, snapshot: OTHER }))).toEqual({ kind: 'conflict', name: 'Wykład' })
  })

  it('zapis doszedł, ale odpowiedź nie (zamknięta karta): ta sama treść to nie konflikt, kopia przyjmuje wersję', () => {
    expect(bootDecision(workspace({ dirty: true }), row({ revision: 4 }))).toEqual({ kind: 'keep', name: 'Wykład', revision: 4 })
  })

  it('wersja w chmurze niższa niż lokalna też jest inną wersją', () => {
    expect(bootDecision(workspace(), row({ revision: 2, snapshot: OTHER })).kind).toBe('applyRemote')
    expect(bootDecision(workspace({ dirty: true }), row({ revision: 2, snapshot: OTHER })).kind).toBe('conflict')
  })

  it.each([null, 'tekst', { v: 2 }, []])('nieczytelna treść w chmurze (%j) nigdy nie jest „tą samą"', (snapshot) => {
    expect(bootDecision(workspace({ dirty: true }), row({ revision: 4, snapshot })).kind).toBe('conflict')
    expect(bootDecision(workspace(), row({ revision: 4, snapshot })).kind).toBe('applyRemote')
  })

  it.each([false, true])('wiersza nie ma (dirty=%s): odpięcie', (dirty) => {
    expect(bootDecision(workspace({ dirty }), null)).toEqual({ kind: 'drop' })
  })

  it.each([false, true])('wiersz należy do kogoś innego albo to inny projekt (dirty=%s): odpięcie', (dirty) => {
    expect(bootDecision(workspace({ dirty }), row({ owner: 'jan' }))).toEqual({ kind: 'drop' })
    expect(bootDecision(workspace({ dirty }), row({ id: 8 }))).toEqual({ kind: 'drop' })
  })

  it.each([false, true])('kopia bez przypięcia (dirty=%s): zostaje wersją roboczą', (dirty) => {
    expect(bootDecision(workspace({ project: null, dirty }), row())).toEqual({ kind: 'drop' })
    expect(bootDecision(workspace({ project: null, dirty }), null)).toEqual({ kind: 'drop' })
  })

  it('niesie nazwę zmienioną w innym miejscu', () => {
    expect(bootDecision(workspace(), row({ name: 'Nowa nazwa' }))).toEqual({ kind: 'keep', name: 'Nowa nazwa', revision: 3 })
    expect(bootDecision(workspace({ dirty: true }), row({ name: 'Nowa nazwa', snapshot: OTHER }))).toEqual({ kind: 'push', name: 'Nowa nazwa' })
    expect(bootDecision(workspace({ dirty: true }), row({ name: 'Nowa nazwa', revision: 9, snapshot: OTHER }))).toEqual({ kind: 'conflict', name: 'Nowa nazwa' })
  })
})

describe('sameContent', () => {
  it('nie zależy od kolejności kluczy (jsonb układa je po swojemu)', () => {
    const reordered = JSON.parse(JSON.stringify(SNAPSHOT), (_key, value: unknown) =>
      value && typeof value === 'object' && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value).reverse())
        : value,
    ) as unknown
    expect(Object.keys(reordered as object)).not.toEqual(Object.keys(SNAPSHOT))
    expect(sameContent(SNAPSHOT, reordered)).toBe(true)
  })

  it('kolejność w listach ma znaczenie', () => {
    const a = { ...SNAPSHOT, form: { ...SNAPSHOT.form, graphics: ['x.png', 'y.png'] } }
    const b = { ...SNAPSHOT, form: { ...SNAPSHOT.form, graphics: ['y.png', 'x.png'] } }
    expect(sameContent(a, b)).toBe(false)
    expect(sameContent(a, JSON.parse(JSON.stringify(a)))).toBe(true)
  })

  it('każda różnica w treści się liczy', () => {
    expect(sameContent(SNAPSHOT, OTHER)).toBe(false)
    expect(sameContent(SNAPSHOT, { ...SNAPSHOT, lang: 'en' })).toBe(false)
    expect(sameContent(SNAPSHOT, { ...SNAPSHOT, extra: 1 })).toBe(false)
    expect(sameContent(SNAPSHOT, null)).toBe(false)
  })
})

describe('bindingOf', () => {
  it('bierze z wiersza identyfikator, nazwę, właściciela i wersję', () => {
    expect(bindingOf(row({ name: 'Gala', revision: 12 }))).toEqual({ id: 7, name: 'Gala', ownerId: 'ola', revision: 12 })
  })
})
