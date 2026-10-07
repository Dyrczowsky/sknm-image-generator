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

export function createWorkspaceStore(kv: Pick<KeyValueStore, 'get' | 'set' | 'del'>): WorkspaceStore {
  return {
    async read(knownLayouts) {
      const raw = await kv.get(WORKSPACE_KEY)
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
