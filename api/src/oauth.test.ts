import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from './env'
import worker from './index'
import { consentPage } from './oauth'

// Pełny przepływ OAuth na prawdziwej bibliotece: rejestracja klienta (DCR), /authorize
// (logowanie + zgoda), wymiana kodu na token, wywołanie MCP z tokenem.

const O = 'https://sknm-api.dyrczkuba.workers.dev'
const REDIRECT = 'https://claude.ai/api/mcp/auth_callback'

function memoryKv(): KVNamespace {
  const m = new Map<string, string>()
  return {
    async get(key: string, opt?: unknown) {
      const v = m.get(key)
      if (v === undefined) return null
      const type = typeof opt === 'string' ? opt : (opt as { type?: string } | undefined)?.type
      return type === 'json' ? JSON.parse(v) : v
    },
    async put(key: string, value: string) { m.set(key, value) },
    async delete(key: string) { m.delete(key) },
    async list({ prefix = '' }: { prefix?: string } = {}) {
      return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true, cacheStatus: null }
    },
  } as unknown as KVNamespace
}

let members: string[] = []
let limitOk = true
function mkEnv(): Env {
  return {
    SUPABASE_URL: 'https://s.test',
    SUPABASE_SERVICE_ROLE_KEY: 'srv',
    RENDER_URL: 'https://r.test/render',
    RATE_LIMITER: { limit: vi.fn(async () => ({ success: limitOk })) },
    BROWSER: {} as Fetcher,
    OAUTH_KV: memoryKv(),
  } as unknown as Env
}

beforeEach(() => {
  members = ['u1']
  limitOk = true
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('https://s.test/auth/v1/token')) {
      const { email, password } = JSON.parse(init!.body as string) as { email: string; password: string }
      if (password !== 'dobre-haslo') return new Response('{"error":"invalid_grant"}', { status: 400 })
      return new Response(JSON.stringify({ user: { id: email === 'obcy@x.pl' ? 'u9' : 'u1', email } }))
    }
    if (url.startsWith('https://s.test/rest/v1/sknm_members')) {
      const id = new URL(url).searchParams.get('user_id')!.replace('eq.', '')
      return new Response(JSON.stringify(members.includes(id) ? [{ user_id: id }] : []))
    }
    return new Response('nieoczekiwane', { status: 500 })
  }))
})
afterEach(() => vi.unstubAllGlobals())

const ctx = { waitUntil: () => undefined, passThroughOnException: () => undefined } as unknown as ExecutionContext
const b64url = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function startAuthorize(env: Env) {
  const call = (r: Request) => worker.fetch(r, env, ctx)
  const reg = await call(new Request(`${O}/oauth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: 'Claude', redirect_uris: [REDIRECT], token_endpoint_auth_method: 'none' }),
  }))
  expect(reg.status).toBe(201)
  const { client_id } = await reg.json() as { client_id: string }
  const verifier = 'v'.repeat(64)
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  const q = new URLSearchParams({
    response_type: 'code', client_id, redirect_uri: REDIRECT, state: 'st1', scope: 'mcp',
    code_challenge: challenge, code_challenge_method: 'S256', resource: `${O}/mcp`,
  })
  const page = await call(new Request(`${O}/authorize?${q}`))
  expect(page.status).toBe(200)
  const html = await page.text()
  const handle = html.match(/name="handle" value="([^"]+)"/)![1]
  const cookie = page.headers.get('Set-Cookie')!.split(';')[0]
  const post = (fields: Record<string, string>) => call(new Request(`${O}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie, Origin: O },
    body: new URLSearchParams({ handle, ...fields }),
  }))
  return { call, client_id, verifier, html, post }
}

describe('OAuth dla MCP', () => {
  it('członek: logowanie, token i wywołanie MCP', async () => {
    const env = mkEnv()
    const { call, client_id, verifier, html, post } = await startAuthorize(env)
    expect(html).toContain('Claude')
    expect(html).toContain('claude.ai')

    const done = await post({ decision: 'approve', email: 'Ja@Sknm.pl ', password: 'dobre-haslo' })
    expect(done.status).toBe(302)
    const back = new URL(done.headers.get('Location')!)
    expect(back.origin + back.pathname).toBe(REDIRECT)
    expect(back.searchParams.get('state')).toBe('st1')

    const tok = await call(new Request(`${O}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: back.searchParams.get('code')!, redirect_uri: REDIRECT, client_id, code_verifier: verifier, resource: `${O}/mcp` }),
    }))
    expect(tok.status).toBe(200)
    const { access_token } = await tok.json() as { access_token: string }

    const mcp = (token: string) => call(new Request(`${O}/mcp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    }))
    expect((await mcp(access_token)).status).toBe(200)

    // Usunięcie z zespołu od razu odbiera dostęp, choć token jest jeszcze ważny.
    members = []
    expect((await mcp(access_token)).status).toBe(403)
    expect((await mcp('zly-token')).status).toBe(401)
  })

  it('MCP bez tokenu: 401 z odnośnikiem do metadanych OAuth', async () => {
    const res = await worker.fetch(new Request(`${O}/mcp`, { method: 'POST' }), mkEnv(), ctx)
    expect(res.status).toBe(401)
    expect(res.headers.get('WWW-Authenticate')).toContain('resource_metadata')
  })

  it('złe hasło, osoba spoza zespołu i limit prób nie dostają kodu', async () => {
    const env = mkEnv()
    const { post } = await startAuthorize(env)
    expect((await post({ decision: 'approve', email: 'ja@sknm.pl', password: 'zle' })).status).toBe(401)
    expect((await post({ decision: 'approve', email: 'obcy@x.pl', password: 'dobre-haslo' })).status).toBe(403)
    limitOk = false
    expect((await post({ decision: 'approve', email: 'ja@sknm.pl', password: 'dobre-haslo' })).status).toBe(429)
    // Formularz był wciąż ważny po błędach: odmowa wraca do klienta z access_denied.
    const denied = await post({ decision: 'deny' })
    expect(denied.status).toBe(302)
    expect(new URL(denied.headers.get('Location')!).searchParams.get('error')).toBe('access_denied')
  })

  it('strona zgody escapuje dane klienta', () => {
    const html = consentPage({ clientId: 'c', clientName: '<script>x</script>', redirectUri: 'https://a/b', redirectHost: 'a"b', redirectIsLoopback: true, scope: ['mcp'] }, 'h')
    expect(html).not.toContain('<script>x')
    expect(html).toContain('&#60;script&#62;')
    expect(html).toContain('aplikacji na tym komputerze')
  })
})
