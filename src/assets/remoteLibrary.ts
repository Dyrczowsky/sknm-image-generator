import type { SupabaseClient } from '@supabase/supabase-js'
import type { AssetKind } from './assets'

// Wpis wspólnej biblioteki grafik zespołu (sam katalog - bajty są w Storage).
export interface LibraryAsset {
  ref: string
  // Znacznik czasu ISO.
  created_at: string
  author_email: string
  kind: AssetKind
  name: string
}

const TABLE = 'sknm_assets'
const COLUMNS = 'ref, created_at, author_email, kind, name'
export const ASSETS_LIMIT = 200
export const ASSET_NAME_MAX_LENGTH = 120
const DUPLICATE_KEY = '23505'

const clip = (name: string) => name.slice(0, ASSET_NAME_MAX_LENGTH)

export async function listAssets(client: SupabaseClient, kind?: AssetKind): Promise<LibraryAsset[]> {
  let query = client.from(TABLE).select(COLUMNS).order('created_at', { ascending: false }).limit(ASSETS_LIMIT)
  if (kind) query = query.eq('kind', kind)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as unknown as LibraryAsset[]
}

// Autora i datę uzupełnia baza. Ten sam plik mógł już wpisać ktoś inny
// (klucz główny = ref) - duplikat to sukces.
export async function registerAsset(client: SupabaseClient, asset: { ref: string; kind: AssetKind; name: string }): Promise<void> {
  const { error } = await client.from(TABLE).insert({ ref: asset.ref, kind: asset.kind, name: clip(asset.name) })
  if (error && error.code !== DUPLICATE_KEY) throw new Error(error.message)
}

export async function renameAsset(client: SupabaseClient, ref: string, name: string): Promise<void> {
  const { error } = await client.from(TABLE).update({ name: clip(name) }).eq('ref', ref)
  if (error) throw new Error(error.message)
}

// Chowa grafikę przed biblioteką; plik w Storage zostaje.
export async function removeAsset(client: SupabaseClient, ref: string): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq('ref', ref)
  if (error) throw new Error(error.message)
}
