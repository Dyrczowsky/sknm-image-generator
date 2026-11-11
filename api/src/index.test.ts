import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from './env'
import worker from './index'

const KEY = 'sknm_' + 'b'.repeat(64)
function mkEnv(success = true): Env {
  return {
    SUPABASE_URL: 'https://s.test',
    SUPABASE_SERVICE_ROLE_KEY: 'srv',
    RENDER_URL: 'https://r.test/render',
    RATE_LIMITER: { limit: vi.fn(async () => ({ success })) },
    BROWSER: {} as Fetcher,
  } as unknown as Env
}
// Supabase RPC sknm_api_key_owner: zna tylko skrót KEY.
let hash = ''
let rpcStatus = 200
beforeEach(async () => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(KEY))
  hash = Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('')
  rpcStatus = 200
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    if (rpcStatus !== 200) return new Response('x', { status: rpcStatus })
    const { p_hash } = JSON.parse(init.body as string) as { p_hash: string }
    return new Response(JSON.stringify(p_hash === hash ? [{ user_id: 'u1', email: 'a@b.pl' }] : []))
  }))
})
afterEach(() => vi.unstubAllGlobals())
const ctx = {} as ExecutionContext
const call = (req: Request, env = mkEnv()) => worker.fetch(req, env, ctx)
const authed = { Authorization: `Bearer ${KEY}` }

describe('index', () => {
  it('brak klucza: 401 bez klucza w treści', async () => {
    const env = mkEnv()
    const res = await call(new Request('https://w.test/api/templates'), env)
    expect(res.status).toBe(401)
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled()
    const text = await res.text()
    expect(JSON.parse(text).code).toBe('unauthorized')
    expect(text).not.toContain(KEY)
  })
  it('zły klucz: 401', async () => {
    const res = await call(new Request('https://w.test/api/templates', { headers: { Authorization: 'Bearer zly' } }))
    expect(res.status).toBe(401)
    const other = await call(new Request('https://w.test/api/templates', { headers: { Authorization: `Bearer sknm_${'c'.repeat(64)}` } }))
    expect(other.status).toBe(401)
  })
  it('błąd Supabase przy sprawdzaniu klucza: 503 storage_failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    rpcStatus = 500
    const res = await call(new Request('https://w.test/api/templates', { headers: authed }))
    expect(res.status).toBe(503)
    expect((await res.json() as { code: string }).code).toBe('storage_failed')
  })
  it('limit: POST /api/render przy przekroczeniu to 429 rate_limited', async () => {
    const res = await call(new Request('https://w.test/api/render', { method: 'POST', headers: authed, body: '{}' }), mkEnv(false))
    expect(res.status).toBe(429)
    expect((await res.json() as { code: string }).code).toBe('rate_limited')
  })
  it('limit: POST /api/render zużywa limit, zanim przeczyta treść', async () => {
    const env = mkEnv()
    await call(new Request('https://w.test/api/render', { method: 'POST', headers: authed, body: '{nie json' }), env)
    expect(env.RATE_LIMITER.limit).toHaveBeenCalledTimes(1)
    expect(env.RATE_LIMITER.limit).toHaveBeenCalledWith({ key: 'u1' })
  })
  it('limit: GET /api/templates i MCP initialize/tools/list nie zużywają limitu', async () => {
    const env = mkEnv(false)
    const res = await call(new Request('https://w.test/api/templates', { headers: authed }), env)
    expect(res.status).toBe(200)
    for (const method of ['initialize', 'tools/list', 'ping']) {
      const r = await call(new Request('https://w.test/mcp', { method: 'POST', headers: authed, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method }) }), env)
      expect(r.status).toBe(200)
    }
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled()
  })
  it('GET /api/templates zwraca katalog', async () => {
    const res = await call(new Request('https://w.test/api/templates', { headers: authed }))
    expect(res.status).toBe(200)
    expect((await res.json() as { version: number }).version).toBe(1)
  })
  it('zła metoda i nieznana ścieżka', async () => {
    expect((await call(new Request('https://w.test/api/render', { headers: authed }))).status).toBe(405)
    expect((await call(new Request('https://w.test/api/templates', { method: 'POST', headers: authed }))).status).toBe(405)
    expect((await call(new Request('https://w.test/nic', { headers: authed }))).status).toBe(404)
  })
  it('/mcp: klucz tylko w nagłówku; klucz w ścieżce nie działa', async () => {
    expect((await call(new Request(`https://w.test/mcp/${KEY}`, { method: 'POST' }))).status).toBe(401)
    expect((await call(new Request(`https://w.test/mcp/${KEY}`, { method: 'POST', headers: authed }))).status).toBe(404)
    const res = await call(new Request('https://w.test/mcp', { method: 'POST', headers: authed, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }) }))
    expect(res.status).toBe(200)
    expect((await call(new Request('https://w.test/mcp'))).status).toBe(401)
  })
  it('/.well-known/oauth-*: metadane OAuth bez uwierzytelnienia', async () => {
    const env = mkEnv()
    const res = await call(new Request('https://sknm-api.dyrczkuba.workers.dev/.well-known/oauth-protected-resource/mcp'), env)
    expect(res.status).toBe(200)
    expect((await res.json() as { resource: string }).resource).toBe('https://sknm-api.dyrczkuba.workers.dev/mcp')
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled()
  })
  it('POST /api/render: zły JSON i brak szablonu to 400', async () => {
    const bad = await call(new Request('https://w.test/api/render', { method: 'POST', headers: authed, body: '{nie json' }))
    expect(bad.status).toBe(400)
    const noTpl = await call(new Request('https://w.test/api/render', { method: 'POST', headers: authed, body: '{}' }))
    expect(noTpl.status).toBe(400)
    expect((await noTpl.json() as { code: string }).code).toBe('bad_request')
  })
  it('za duże ciało: 413 bad_request (nagłówek i faktyczna długość)', async () => {
    const big = 'x'.repeat(25 * 1024 * 1024 + 1)
    const a = await call(new Request('https://w.test/api/render', { method: 'POST', headers: { ...authed, 'content-length': String(big.length) }, body: big }))
    expect(a.status).toBe(413)
    expect((await a.json() as { code: string }).code).toBe('bad_request')
    const b = await call(new Request('https://w.test/api/render', { method: 'POST', headers: authed, body: big }))
    expect(b.status).toBe(413)
  })
})
