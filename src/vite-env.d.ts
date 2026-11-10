/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Wstrzykiwane przez Vite `define` (skrót hasha commita z GITHUB_SHA, lokalnie "dev").
declare const __APP_VERSION__: string

// Konfiguracja Supabase (patrz .env.example). Brak = aplikacja bez logowania.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}
