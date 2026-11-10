import { describe, expect, it, vi } from 'vitest'
import type { Env } from './env'
import worker from './index'

const KEY = 'super-tajny-klucz'
function mkEnv(success = true): Env {
  return {
    SKNM_API_KEY: KEY,
    SUPABASE_URL: 'https://s.test',
    SUPABASE_SERVICE_ROLE_KEY: 'srv',
    RENDER_URL: 'https://r.test/render',
    RATE_LIMITER: { limit: vi.fn(async () => ({ success })) },
    BROWSER: {} as Fetcher,
  } as unknown as Env
}
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
  })
  it('limit: 429 rate_limited', async () => {
    const res = await call(new Request('https://w.test/api/templates', { headers: authed }), mkEnv(false))
    expect(res.status).toBe(429)
    expect((await res.json() as { code: string }).code).toBe('rate_limited')
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
  it('/mcp po uwierzytelnieniu daje 404 (do zadania 9)', async () => {
    expect((await call(new Request(`https://w.test/mcp/${KEY}`))).status).toBe(404)
    expect((await call(new Request('https://w.test/mcp', { headers: authed }))).status).toBe(404)
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
