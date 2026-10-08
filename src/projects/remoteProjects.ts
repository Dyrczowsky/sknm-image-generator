import type { SupabaseClient } from '@supabase/supabase-js'

// Projekt w chmurze: własny albo udostępniony zespołowi (tylko do odczytu).
export interface ProjectRow {
  id: number
  // Znaczniki czasu ISO.
  created_at: string
  updated_at: string
  owner: string
  owner_email: string
  name: string
  shared: boolean
  // Zwiększana przez bazę przy każdej zmianie `snapshot`.
  revision: number
  // Surowy jsonb - wołający waliduje go przez `parseSnapshot`.
  snapshot: unknown
}

const TABLE = 'sknm_projects'
const COLUMNS = 'id, created_at, updated_at, owner, owner_email, name, shared, revision, snapshot'
export const PROJECTS_LIMIT = 100
export const PROJECT_NAME_MAX = 120
const DEFAULT_NAME = 'Bez tytułu'

// Zapis z nieaktualną rewizją: ktoś zapisał nowszą wersję albo projekt zniknął.
export class ProjectConflictError extends Error {
  constructor() {
    super('Projekt został zmieniony gdzie indziej.')
    this.name = 'ProjectConflictError'
  }
}

export async function listProjects(client: SupabaseClient): Promise<ProjectRow[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(PROJECTS_LIMIT)
  if (error) throw new Error(error.message)
  return data as ProjectRow[]
}

// `null`, gdy wiersza nie ma albo przestał być widoczny.
export async function getProject(client: SupabaseClient, id: number): Promise<ProjectRow | null> {
  const { data, error } = await client.from(TABLE).select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as ProjectRow | null) ?? null
}

export interface NewProject {
  name: string
  snapshot: unknown
  shared?: boolean
}

// Właściciela, daty i rewizję uzupełnia baza.
export async function createProject(client: SupabaseClient, { name, snapshot, shared = false }: NewProject): Promise<ProjectRow> {
  const { data, error } = await client.from(TABLE).insert({ name, snapshot, shared }).select(COLUMNS).single()
  if (error) throw new Error(error.message)
  return data as ProjectRow
}

// Zapis pod warunkiem, że rewizja w bazie to nadal ta wczytana (`revision`).
export async function saveProject(client: SupabaseClient, id: number, revision: number, snapshot: unknown): Promise<ProjectRow> {
  const { data, error } = await client
    .from(TABLE)
    .update({ snapshot })
    .eq('id', id)
    .eq('revision', revision)
    .select(COLUMNS)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new ProjectConflictError()
  return data as ProjectRow
}

async function updateMeta(client: SupabaseClient, id: number, change: { name: string } | { shared: boolean }): Promise<ProjectRow> {
  const { data, error } = await client.from(TABLE).update(change).eq('id', id).select(COLUMNS).single()
  if (error) throw new Error(error.message)
  return data as ProjectRow
}

export const renameProject = (client: SupabaseClient, id: number, name: string) => updateMeta(client, id, { name })

export const setProjectShared = (client: SupabaseClient, id: number, shared: boolean) => updateMeta(client, id, { shared })

export async function deleteProject(client: SupabaseClient, id: number): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// Nazwa nowego projektu z tytułu plakatu.
export function projectNameFrom(title: string): string {
  return title.trim().slice(0, PROJECT_NAME_MAX).trimEnd() || DEFAULT_NAME
}
