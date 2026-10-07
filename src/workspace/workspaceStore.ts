import { del, get, set } from 'idb-keyval'
import type { KeyValueStore } from '../assets/localStore'
import { parseSnapshot } from '../snapshot/snapshot'
import type { ProjectBinding, Workspace } from './syncState'

// Lokalna kopia robocza: jeden wpis w IndexedDB (ta sama baza idb-keyval co
// baza SQL i grafiki). Wspólna dla wszystkich kart przeglądarki - wygrywa
// ostatni zapis.
export const WORKSPACE_KEY = 'sknm-workspace'

export type WorkspaceRead =
  | { kind: 'absent' }
  | { kind: 'ok'; workspace: Workspace }
  // `newer` / `unknownLayout`: kopię zapisała nowsza wersja aplikacji - nie
  // wolno jej ani wczytać, ani nadpisać. `invalid`: śmieci.
  | { kind: 'rejected'; reason: 'newer' | 'unknownLayout' | 'invalid' }
  // Odczyt się nie udał (błąd IndexedDB, bywa chwilowy). Wpis może istnieć,
  // więc to nie jest `absent`: nie wolno go nadpisać pustym plakatem.
  | { kind: 'unreadable' }

export interface WorkspaceStore {
  read(knownLayouts: readonly string[]): Promise<WorkspaceRead>
  write(workspace: Workspace): Promise<void>
  clear(): Promise<void>
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

// Przypięcie z niezaufanego zapisu; cokolwiek niepełnego → brak przypięcia.
function parseBinding(raw: unknown): ProjectBinding | null {
  if (!isObject(raw)) return null
  const { id, name, ownerId, revision } = raw
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) return null
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision)) return null
  if (typeof name !== 'string' || typeof ownerId !== 'string' || ownerId.length === 0) return null
  return { id, name, ownerId, revision }
}

// Od czego zaczyna edytor po odczycie kopii i czy wolno ją w tej sesji zapisywać.
export interface LocalStart {
  // `stored` - zapisana kopia; `legacy` - nic nie zapisano: draft sprzed kopii
  // roboczej albo pusty plakat; `blank` - pusty plakat.
  source: 'stored' | 'legacy' | 'blank'
  // Pod kluczem leży (albo może leżeć) coś, czego nie wolno zastąpić: zapis
  // lokalny jest wyłączony do przeładowania strony.
  locked: boolean
  // Co powiedzieć użytkownikowi.
  problem: 'newer' | 'unreadable' | null
}

export function localStart(read: WorkspaceRead): LocalStart {
  switch (read.kind) {
    case 'ok':
      return { source: 'stored', locked: false, problem: null }
    case 'absent':
      return { source: 'legacy', locked: false, problem: null }
    case 'unreadable':
      return { source: 'blank', locked: true, problem: 'unreadable' }
    case 'rejected':
      // Śmieci nie mają czego chronić - pusty plakat je zastąpi.
      return read.reason === 'invalid' ? { source: 'blank', locked: false, problem: null } : { source: 'blank', locked: true, problem: 'newer' }
  }
}

export function createWorkspaceStore(kv: Pick<KeyValueStore, 'get' | 'set' | 'del'>): WorkspaceStore {
  return {
    async read(knownLayouts) {
      let raw: unknown
      try {
        raw = await kv.get(WORKSPACE_KEY)
      } catch {
        return { kind: 'unreadable' }
      }
      if (raw === undefined || raw === null) return { kind: 'absent' }
      if (!isObject(raw)) return { kind: 'rejected', reason: 'invalid' }
      const parsed = parseSnapshot(raw.snapshot, knownLayouts)
      if (!parsed.ok) return { kind: 'rejected', reason: parsed.reason }
      const project = parseBinding(raw.project)
      // Zepsute przypięcie: treść zostaje, ale jako niezapisana wersja robocza.
      const lostBinding = project === null && raw.project !== null && raw.project !== undefined
      return { kind: 'ok', workspace: { snapshot: parsed.snapshot, project, dirty: lostBinding || raw.dirty === true } }
    },
    write: (workspace) => kv.set(WORKSPACE_KEY, { snapshot: workspace.snapshot, project: workspace.project, dirty: workspace.dirty }),
    clear: () => kv.del(WORKSPACE_KEY),
  }
}

export const workspaceStore: WorkspaceStore = createWorkspaceStore({ get, set, del })
