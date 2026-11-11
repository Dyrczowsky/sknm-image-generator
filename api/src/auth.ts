import type { Env } from './env'
import { supabase } from './supabase'

// Właściciel osobistego klucza API (tabela `sknm_api_keys`).
export interface Owner { id: string; email: string }

// Format klucza z `sknm_regenerate_api_key()`; inny od razu odrzucamy, bez zapytania do bazy.
const KEY_RE = /^sknm_[0-9a-f]{64}$/

// Klucz tylko z nagłówka `Authorization: Bearer <klucz>`.
export function keyFrom(request: Request): string | null {
  const bearer = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  return bearer && KEY_RE.test(bearer) ? bearer : null
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Baza zna tylko skrót klucza; szukamy po skrócie (nie trzeba porównania w stałym czasie).
// `null` = brak lub zły klucz, albo osoba nie jest już członkiem. Błąd Supabase rzuca wyjątek.
export async function authenticate(request: Request, env: Env, sb: typeof supabase = supabase): Promise<Owner | null> {
  const key = keyFrom(request)
  if (!key) return null
  return sb(env).apiKeyOwner(await sha256Hex(key))
}
