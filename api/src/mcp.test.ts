import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from './env'
import type { GenerateResult } from './generate'
import { handleMcp } from './mcp'

const limiter = { limit: vi.fn(async () => ({ success: true })) }
const env = { RATE_LIMITER: limiter } as unknown as Env
const owner = { id: 'u1', email: 'a@b.pl' }
const okResult: GenerateResult = { ok: true, value: { url: 'https://x.test/a.png', width: 1080, height: 1080, historyId: 7, png: 'QUJD' } }
const post = (body: unknown) =>
  new Request('https://w.test/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) })
const rpc = (method: string, params?: unknown, id: number | null = 1) => ({ jsonrpc: '2.0', id, method, params })
const savePhoto = vi.fn(async () => ({ ok: true as const, value: { ref: 'a'.repeat(64) + '.jpg', name: 'Panorama PK' } }))
const listPhotos = vi.fn(async () => ({ ok: true as const, value: [{ ref: 'b'.repeat(64) + '.jpg', name: 'Kampus', created_at: '2026-11-11' }] }))
const run = async (body: unknown, generate = vi.fn(async (): Promise<GenerateResult> => okResult)) => {
  const res = await handleMcp(post(body), env, owner, { generate, savePhoto, listPhotos })
  const text = await res.text()
  return { res, json: text ? JSON.parse(text) : null, generate }
}

describe('mcp', () => {
  beforeEach(() => limiter.limit.mockClear())
  it('limit: initialize, tools/list i list_templates go nie zużywają', async () => {
    await run(rpc('initialize', {}))
    await run(rpc('tools/list'))
    await run(rpc('tools/call', { name: 'list_templates' }))
    expect(limiter.limit).not.toHaveBeenCalled()
  })
  it('limit: generate_image zużywa limit', async () => {
    await run(rpc('tools/call', { name: 'generate_image', arguments: { template: 'wyklad' } }))
    expect(limiter.limit).toHaveBeenCalledWith({ key: 'u1' })
  })
  it('limit przekroczony: wynik narzędzia z isError, bez wywołania generate', async () => {
    limiter.limit.mockResolvedValueOnce({ success: false })
    const { res, json, generate } = await run(rpc('tools/call', { name: 'generate_image', arguments: { template: 'wyklad' } }))
    expect(res.status).toBe(200)
    expect(json.result.isError).toBe(true)
    expect(json.result.content[0].text).toMatch(/^rate_limited: /)
    expect(generate).not.toHaveBeenCalled()
  })
  it('GET daje 405', async () => {
    expect((await handleMcp(new Request('https://w.test/mcp'), env, owner)).status).toBe(405)
  })
  it('initialize zwraca serverInfo i echo wersji', async () => {
    const { res, json } = await run(rpc('initialize', { protocolVersion: '2025-03-26' }))
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(json.result.serverInfo.name).toBe('sknm-generator')
    expect(json.result.protocolVersion).toBe('2025-03-26')
    expect(json.result.capabilities).toEqual({ tools: {} })
    expect((await run(rpc('initialize', { protocolVersion: '1999' }))).json.result.protocolVersion).toBe('2025-06-18')
  })
  it('notyfikacja: 202 bez treści', async () => {
    const { res, json } = await run({ jsonrpc: '2.0', method: 'notifications/initialized' })
    expect(res.status).toBe(202)
    expect(json).toBeNull()
  })
  it('ping', async () => {
    expect((await run(rpc('ping'))).json.result).toEqual({})
  })
  it('tools/list zwraca oba narzędzia', async () => {
    const { json } = await run(rpc('tools/list'))
    const tools = json.result.tools as { name: string; inputSchema: { required?: string[]; properties: { fields?: { properties: object } } } }[]
    expect(tools.map((t) => t.name)).toEqual(['list_templates', 'generate_image', 'list_photos', 'save_photo'])
    expect(tools[1].inputSchema.required).toContain('template')
    expect(Object.keys(tools[1].inputSchema.properties.fields!.properties).sort())
      .toEqual(['badge', 'badge2', 'body', 'event_date', 'event_time', 'location', 'speaker', 'subtitle', 'title', 'year'])
  })
  it('list_templates zwraca katalog', async () => {
    const { json } = await run(rpc('tools/call', { name: 'list_templates' }))
    expect(JSON.parse(json.result.content[0].text).version).toBe(1)
  })
  it('generate_image: sukces', async () => {
    const { json, generate } = await run(rpc('tools/call', { name: 'generate_image', arguments: { template: 'wyklad' } }))
    expect(generate).toHaveBeenCalledWith(env, owner, { template: 'wyklad' })
    expect(json.result.content[0].text).toBe('Grafika: https://x.test/a.png\nWpis w historii: #7')
    expect(json.result.content[1]).toEqual({ type: 'image', data: 'QUJD', mimeType: 'image/png' })
    expect(json.result.isError).toBeUndefined()
  })
  it('generate_image: podgląd JPEG zamiast pełnego PNG; save: false bez adresu', async () => {
    const preview = vi.fn(async (): Promise<GenerateResult> => ({ ok: true, value: { ...okResult.value, url: null, historyId: null, preview: 'SlBH' } }))
    const { json } = await run(rpc('tools/call', { name: 'generate_image', arguments: { template: 'wyklad', save: false } }), preview)
    expect(json.result.content[0].text).toContain('nic nie zapisano')
    expect(json.result.content[1]).toEqual({ type: 'image', data: 'SlBH', mimeType: 'image/jpeg' })
  })
  it('list_photos bez limitu, save_photo zużywa limit i zwraca ref', async () => {
    const listed = await run(rpc('tools/call', { name: 'list_photos' }))
    expect(JSON.parse(listed.json.result.content[0].text)[0].name).toBe('Kampus')
    expect(limiter.limit).not.toHaveBeenCalled()
    const saved = await run(rpc('tools/call', { name: 'save_photo', arguments: { name: 'Panorama PK', url: 'https://x/p.jpg' } }))
    expect(savePhoto).toHaveBeenCalledWith(env, owner, { name: 'Panorama PK', url: 'https://x/p.jpg' })
    expect(saved.json.result.content[0].text).toContain(`ref: ${'a'.repeat(64)}.jpg`)
    expect(limiter.limit).toHaveBeenCalledTimes(1)
  })
  it('generate_image: błąd', async () => {
    const generate = vi.fn(async (): Promise<GenerateResult> => ({ ok: false, error: { code: 'unknown_template', message: 'Brak.' } }))
    const { json } = await run(rpc('tools/call', { name: 'generate_image', arguments: { template: 'x' } }), generate)
    expect(json.result.isError).toBe(true)
    expect(json.result.content[0].text).toBe('unknown_template: Brak.')
  })
  it('nieznane narzędzie i brak nazwy: -32602', async () => {
    expect((await run(rpc('tools/call', { name: 'nic' }))).json.error.code).toBe(-32602)
    expect((await run(rpc('tools/call', {}))).json.error.code).toBe(-32602)
  })
  it('nieznana metoda: -32601', async () => {
    expect((await run(rpc('foo/bar'))).json.error.code).toBe(-32601)
  })
  it('zły JSON: -32700; zła struktura: -32600', async () => {
    const a = await run('{nie json')
    expect(a.json.error.code).toBe(-32700)
    expect(a.json.id).toBeNull()
    expect((await run({ foo: 1 })).json.error.code).toBe(-32600)
  })
  it('paczka (tablica): -32600, także same notyfikacje', async () => {
    const a = await run([rpc('ping')])
    expect(a.json.error.code).toBe(-32600)
    expect(a.json.id).toBeNull()
    expect(a.generate).not.toHaveBeenCalled()
    expect((await run([{ jsonrpc: '2.0', method: 'notifications/initialized' }])).json.error.code).toBe(-32600)
  })
  it('nieoczekiwany wyjątek: -32603 bez szczegółów', async () => {
    const generate = vi.fn(async (): Promise<GenerateResult> => { throw new Error('tajne') })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { json, res } = await run(rpc('tools/call', { name: 'generate_image', arguments: { template: 'x' } }), generate)
    spy.mockRestore()
    expect(res.status).toBe(200)
    expect(json.error.code).toBe(-32603)
    expect(JSON.stringify(json)).not.toContain('tajne')
  })
})
