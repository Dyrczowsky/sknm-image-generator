import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider'

// Powiązania i sekrety Workera `sknm-api`.
export interface Env {
  BROWSER: Fetcher
  RATE_LIMITER: RateLimit
  RENDER_URL: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  // OAuth dla connectorów MCP: magazyn klientów, grantów i tokenów; pomocnik wstrzykiwany przez OAuthProvider.
  OAUTH_KV: KVNamespace
  OAUTH_PROVIDER: OAuthHelpers
}
