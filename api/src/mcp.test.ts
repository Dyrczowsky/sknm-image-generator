import { describe, expect, it, vi } from 'vitest'
import type { Env } from './env'
import type { GenerateResult } from './generate'
import { handleMcp } from './mcp'

const env = {} as Env
const okResult: GenerateResult = { ok: true, value: { url: 'https://x.test/a.png', width: 1080, height: 1080, historyId: 7, png: 'QUJD' } }
const post = (body: unknown) =>
  new Request('https://w.test/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) })
const rpc = (method: string, params?: unknown, id: number | null = 1) => ({ jsonrpc: '2.0', id, method, params })
const run = async (body: unknown, generate = vi.fn(async (): Promise<GenerateResult> => okResult)) => {
  const res = await handleMcp(post(body), env, { generate })
  const text = await res.text()
  return { res, json: text ? JSON.parse(text) : null, generate }
}

describe('mcp', () => {
  it('GET daje 405', async () => {
    expect((await handleMcp(new Request('https://w.test/mcp'), env)).status).toBe(405)
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
    const tools = json.result.tools as { name: string; inputSchema: { required?: string[] } }[]
    expect(tools.map((t) => t.name)).toEqual(['list_templates', 'generate_image'])
    expect(tools[1].inputSchema.required).toContain('template')
  })
  it('list_templates zwraca katalog', async () => {
    const { json } = await run(rpc('tools/call', { name: 'list_templates' }))
    expect(JSON.parse(json.result.content[0].text).version).toBe(1)
  })
  it('generate_image: sukces', async () => {
    const { json, generate } = await run(rpc('tools/call', { name: 'generate_image', arguments: { template: 'wyklad' } }))
    expect(generate).toHaveBeenCalledWith(env, { template: 'wyklad' })
    expect(json.result.content[0].text).toBe('Grafika: https://x.test/a.png\nWpis w historii: #7')
    expect(json.result.content[1]).toEqual({ type: 'image', data: 'QUJD', mimeType: 'image/png' })
    expect(json.result.isError).toBeUndefined()
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
