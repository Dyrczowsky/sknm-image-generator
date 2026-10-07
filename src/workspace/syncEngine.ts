import { ProjectConflictError, projectNameFrom } from '../projects/remoteProjects'
import type { ProjectRow } from '../projects/remoteProjects'
import type { EditorSnapshot } from '../snapshot/snapshot'
import { bindingOf, bootDecision, reconcileBinding, reduceSaveStatus } from './syncState'
import type { BindingAction, BootDecision, ProjectBinding, SaveEvent, SaveStatus, Workspace } from './syncState'

// Silnik kopii roboczej bez Reacta: pilnuje, kiedy bieżący snapshot trafia do
// IndexedDB i do chmury. Hook `useWorkspace` podaje mu kolejne snapshoty
// (`observe`) i wczytane dokumenty (`load`), a sam zajmuje się edytorem.
// Wejście/wyjście jest wstrzykiwane, więc całość testuje się w node.

export const LOCAL_SAVE_DELAY_MS = 400
export const SYNC_DELAY_MS = 2000
// Ponowienie po nieudanym zapisie, gdy użytkownik niczego już nie zmienia.
export const RETRY_DELAY_MS = 15000

export interface EngineDeps {
  writeLocal(workspace: Workspace): Promise<void>
  // Wgrywa grafiki snapshotu do Storage (przed zapisem wiersza).
  upload(snapshot: EditorSnapshot): Promise<void>
  create(name: string, snapshot: EditorSnapshot): Promise<ProjectRow>
  // Rzuca `ProjectConflictError`, gdy wersja w chmurze jest już inna.
  save(id: number, revision: number, snapshot: EditorSnapshot): Promise<ProjectRow>
  // Każdy wiersz zapisany w chmurze (lista projektów go podmienia).
  onSaved?(row: ProjectRow): void
  // Zapis odbił się od nowszej wersji w chmurze. Wołający pobiera wiersz
  // i podaje go do `reconcileRemote` - jeśli treść jest ta sama (nasz własny
  // zapis, którego odpowiedź nie doszła), konflikt znika sam.
  onConflict?(): void
  onChange?(state: EngineState): void
}

export interface EngineState {
  project: ProjectBinding | null
  status: SaveStatus
  dirty: boolean
}

// `signedOut` - nikt nie jest zalogowany; `blocked` - konflikt albo projekt wstrzymany.
export type SaveResult = 'saved' | 'failed' | 'signedOut' | 'blocked'

export type WorkspaceEngine = ReturnType<typeof createWorkspaceEngine>

export function createWorkspaceEngine(deps: EngineDeps) {
  let snapshot: EditorSnapshot | null = null
  // Zserializowany snapshot ostatnio widziany w `observe`; `null` = po `load`
  // jeszcze żadnego nie było i pierwszy będzie punktem odniesienia.
  let seen: string | null = null
  let project: ProjectBinding | null = null
  let dirty = false
  let status: SaveStatus = 'local'
  let userId: string | null = null
  let userKnown = false
  // Numer wczytanego dokumentu: `observe` ze starszym numerem to render sprzed
  // wczytania.
  let epoch = 0
  // Rośnie przy wczytaniu i przy odpięciu projektu: wynik zapisu rozpoczętego
  // wcześniej dotyczy już czegoś innego.
  let generation = 0
  let localTimer: ReturnType<typeof setTimeout> | undefined
  let syncTimer: ReturnType<typeof setTimeout> | undefined
  let inFlight: Promise<boolean> | null = null

  const getState = (): EngineState => ({ project, status, dirty })
  const emit = () => deps.onChange?.(getState())
  const dispatch = (event: SaveEvent) => {
    status = reduceSaveStatus(status, event)
  }

  const isOwner = () => project !== null && userId === project.ownerId
  const canSync = () => isOwner() && status !== 'conflict' && status !== 'paused'

  const writeLocal = (): Promise<void> => {
    clearTimeout(localTimer)
    localTimer = undefined
    if (!snapshot) return Promise.resolve()
    // Błąd IndexedDB (tryb prywatny, brak miejsca) nie może zatrzymać edytora.
    return deps.writeLocal({ snapshot, project, dirty }).catch(() => {})
  }

  const scheduleLocal = () => {
    clearTimeout(localTimer)
    localTimer = setTimeout(() => void writeLocal(), LOCAL_SAVE_DELAY_MS)
  }

  const cancelSync = () => {
    clearTimeout(syncTimer)
    syncTimer = undefined
  }

  const scheduleSync = (delay: number) => {
    cancelSync()
    syncTimer = setTimeout(() => {
      syncTimer = undefined
      if (project && dirty && canSync()) void startSave()
    }, delay)
  }

  // Jedno żądanie zapisu: utworzenie projektu (brak przypięcia) albo zapis
  // z pilnowaniem wersji. Zmiany, które przyjdą w trakcie, zostają `dirty`.
  const save = async (): Promise<boolean> => {
    const startedAt = generation
    const sent = snapshot
    const sentSerialized = seen
    const target = project
    if (!sent) return false
    cancelSync()
    dispatch({ type: 'saveStarted' })
    emit()
    try {
      await deps.upload(sent)
      const row = target ? await deps.save(target.id, target.revision, sent) : await deps.create(projectNameFrom(sent.form.title), sent)
      deps.onSaved?.(row)
      // W trakcie żądania wczytano inny dokument albo odpięto projekt.
      if (startedAt !== generation) return false
      project = bindingOf(row)
      dirty = seen !== sentSerialized
      dispatch({ type: 'saveSucceeded', dirty })
      emit()
      void writeLocal()
      if (dirty && canSync()) scheduleSync(SYNC_DELAY_MS)
      return true
    } catch (error) {
      if (startedAt !== generation) return false
      if (error instanceof ProjectConflictError) {
        dispatch({ type: 'conflict' })
        emit()
        deps.onConflict?.()
        return false
      } else {
        dispatch({ type: 'saveFailed', bound: target !== null })
        if (target) scheduleSync(RETRY_DELAY_MS)
      }
      emit()
      return false
    }
  }

  // Najwyżej jedno żądanie naraz.
  const startSave = (): Promise<boolean> => {
    if (inFlight) return inFlight
    const request = save().finally(() => {
      if (inFlight === request) inFlight = null
    })
    inFlight = request
    return request
  }

  // Odpina projekt: treść zostaje jako niezapisana wersja robocza.
  const detach = () => {
    if (!project) return
    generation += 1
    cancelSync()
    project = null
    dirty = true
    dispatch({ type: 'unbound' })
    emit()
    void writeLocal()
  }

  return {
    getState,

    // Wczytano dokument do edytora. Zwraca numer, z którym hook woła `observe`;
    // pierwszy `observe` z tym numerem jest punktem odniesienia, nie edycją.
    load(workspace: Workspace): number {
      epoch += 1
      generation += 1
      cancelSync()
      snapshot = workspace.snapshot
      seen = null
      project = workspace.project
      dirty = workspace.dirty
      dispatch({ type: 'opened', bound: project !== null, dirty, online: isOwner() })
      emit()
      void writeLocal()
      return epoch
    },

    // Bieżący snapshot edytora po każdej zmianie stanu.
    observe(next: EditorSnapshot, serialized: string, forEpoch: number): void {
      if (forEpoch !== epoch) return
      if (seen === null) {
        // Stan zaraz po wczytaniu może różnić się od wczytanego snapshotu
        // (normalizacja kolorów, grafiki) - to jeszcze nie zmiana użytkownika.
        seen = serialized
        snapshot = next
        void writeLocal()
        if (project && dirty && canSync()) scheduleSync(SYNC_DELAY_MS)
        return
      }
      if (serialized === seen) return
      seen = serialized
      snapshot = next
      dirty = true
      dispatch({ type: 'edited' })
      emit()
      scheduleLocal()
      if (project && canSync()) scheduleSync(SYNC_DELAY_MS)
    },

    // Znana jest zalogowana osoba (`null` = nikt). Zwraca, co z tego wynikło;
    // `resume` oznacza, że wołający powinien porównać kopię z chmurą.
    setUser(next: string | null): BindingAction {
      if (userKnown && next === userId) return 'none'
      userKnown = true
      userId = next
      if (!snapshot) return 'none'
      const { action } = reconcileBinding({ snapshot, project, dirty }, next)
      if (action === 'pause') {
        cancelSync()
        dispatch({ type: 'paused' })
        emit()
      } else if (action === 'unbind') {
        detach()
      } else if (action === 'resume') {
        dispatch({ type: 'resumed', dirty })
        emit()
      }
      return action
    },

    // Porównuje kopię z wierszem z chmury (`null` = nie ma go) i wykonuje
    // wszystko poza `applyRemote` - wczytanie do edytora należy do wołającego.
    reconcileRemote(row: ProjectRow | null): BootDecision {
      if (!snapshot || !project) return { kind: 'drop' }
      const decision = bootDecision({ snapshot, project, dirty }, row)
      if (decision.kind === 'drop') {
        detach()
        return decision
      }
      if (decision.kind === 'applyRemote') return decision
      if (decision.name !== project.name) {
        project = { ...project, name: decision.name }
        void writeLocal()
      }
      if (decision.kind === 'keep') {
        if (dirty || decision.revision !== project.revision || status === 'conflict') {
          // W chmurze jest dokładnie ta treść: nie ma czego wysyłać ani rozstrzygać.
          cancelSync()
          project = { ...project, revision: decision.revision }
          dirty = false
          dispatch({ type: 'opened', bound: true, dirty: false, online: isOwner() })
          void writeLocal()
        }
      } else if (decision.kind === 'conflict') {
        cancelSync()
        dispatch({ type: 'conflict' })
      } else if (decision.kind === 'push' && canSync()) {
        scheduleSync(0)
      }
      emit()
      return decision
    },

    // Chmury nie udało się zapytać: zapis zmian próbuje normalną drogą.
    retrySync(): void {
      if (project && dirty && canSync() && !inFlight) scheduleSync(0)
    },

    // „Zapisz": pierwszy zapis tworzy projekt i przypina do niego kopię.
    async saveNow(): Promise<SaveResult> {
      if (!snapshot) return 'failed'
      if (userId === null) return 'signedOut'
      if (project && !canSync()) return 'blocked'
      if (project && !dirty && !inFlight) return 'saved'
      return (await startSave()) ? 'saved' : 'failed'
    },

    // Doprowadza chmurę do bieżącego stanu przed zmianą dokumentu. `true`, gdy
    // nic nie zostało do zapisania (wersja robocza nie ma czego wysyłać).
    async flush(): Promise<boolean> {
      await writeLocal()
      for (;;) {
        if (inFlight) await inFlight
        if (!project || !dirty) return true
        if (!canSync()) return false
        if (!(await startSave())) return false
      }
    },

    // Natychmiastowy zapis lokalny i próba wysłania (karta schodzi z ekranu).
    flushSoon(): void {
      void writeLocal()
      if (project && dirty && canSync()) void startSave()
    },

    // „Nadpisz" po konflikcie: bieżąca treść idzie na wersję `row` z chmury.
    // Gdy wiersza już nie ma, treść zostaje wersją roboczą.
    async overwrite(row: ProjectRow | null): Promise<boolean> {
      if (!project) return false
      if (!row || row.id !== project.id || row.owner !== project.ownerId) {
        detach()
        return false
      }
      project = bindingOf(row)
      dirty = true
      dispatch({ type: 'opened', bound: true, dirty: true, online: isOwner() })
      emit()
      if (!canSync()) return false
      return startSave()
    },

    detach,

    // Nazwę zmieniono na liście projektów.
    rename(id: number, name: string): void {
      if (project?.id !== id || project.name === name) return
      project = { ...project, name }
      emit()
      void writeLocal()
    },

    dispose(): void {
      clearTimeout(localTimer)
      cancelSync()
    },
  }
}
