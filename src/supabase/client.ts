import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Czy użytkownik wszedł linkiem z zaproszenia albo z resetu hasła - ma wtedy
// sesję, ale musi dopiero ustawić hasło. Odczytane PRZED utworzeniem klienta,
// bo ten zużywa i czyści fragment adresu.
export const arrivedToSetPassword = /[#&]type=(invite|recovery)\b/.test(window.location.hash)

// Klient Supabase albo `null`, gdy aplikacja jest zbudowana bez konfiguracji
// (brak logowania, historii i notatek - sam generator działa dalej).
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

// Klient dla kodu, który działa tylko po zalogowaniu.
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany')
  return supabase
}
