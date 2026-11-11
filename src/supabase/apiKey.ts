import type { SupabaseClient } from '@supabase/supabase-js'

// Adres Workera sknm-api (api/), do instrukcji podłączenia w panelu konta.
export const API_URL = 'https://sknm-api.dyrczkuba.workers.dev'

// Metadane osobistego klucza API; sam klucz zna tylko jego właściciel (widzi go raz).
export interface ApiKeyInfo {
  prefix: string
  created_at: string
  last_used_at: string | null
}

export async function getApiKey(client: SupabaseClient): Promise<ApiKeyInfo | null> {
  const { data, error } = await client.from('sknm_api_keys').select('prefix, created_at, last_used_at').maybeSingle()
  if (error) throw new Error(error.message)
  return data as ApiKeyInfo | null
}

// Nowy klucz (stary przestaje działać); generuje go baza, tylko dla członków zespołu.
export async function regenerateApiKey(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('sknm_regenerate_api_key')
  if (error) throw new Error(error.message)
  return data as string
}

// RLS ogranicza usuwanie do własnego wiersza; filtr jest wymagany przez PostgREST.
export async function revokeApiKey(client: SupabaseClient, userId: string): Promise<void> {
  const { error } = await client.from('sknm_api_keys').delete().eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export const mcpCommand = (key: string) =>
  `claude mcp add --transport http --scope user sknm ${API_URL}/mcp --header "Authorization: Bearer ${key}"`
