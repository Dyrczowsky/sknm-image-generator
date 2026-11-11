// Powiązania i sekrety Workera `sknm-api`.
export interface Env {
  BROWSER: Fetcher
  RATE_LIMITER: RateLimit
  RENDER_URL: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}
