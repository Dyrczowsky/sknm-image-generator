import { describe, expect, it, vi } from 'vitest'
import { authenticate, keyFrom, sha256Hex } from './auth'
import type { Env } from './env'

const KEY = 'sknm_' + 'a'.repeat(64)
const req = (auth?: string, path = '/api/templates') => new Request(`https://x.test${path}`, auth ? { headers: { Authorization: auth } } : {})

describe('keyFrom', () => {
  it('czyta klucz tylko z nagłówka Bearer', () => {
    expect(keyFrom(req(`Bearer ${KEY}`))).toBe(KEY)
    expect(keyFrom(req(`bearer  ${KEY} `))).toBe(KEY)
    expect(keyFrom(req(undefined, `/mcp/${KEY}`))).toBeNull()
  })
  it('klucz w złym formacie to null', () => {
    for (const k of ['', 'abc', KEY.slice(0, -1), KEY.toUpperCase(), KEY + 'a']) expect(keyFrom(req(`Bearer ${k}`))).toBeNull()
  })
})

describe('authenticate', () => {
  const env = {} as Env
  it('szuka właściciela po skrócie SHA-256 klucza', async () => {
    const apiKeyOwner = vi.fn(async () => ({ id: 'u1', email: 'a@b.pl' }))
    expect(await authenticate(req(`Bearer ${KEY}`), env, (() => ({ apiKeyOwner })) as never)).toEqual({ id: 'u1', email: 'a@b.pl' })
    expect(apiKeyOwner).toHaveBeenCalledWith(await sha256Hex(KEY))
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
  it('bez klucza nie pyta bazy', async () => {
    const apiKeyOwner = vi.fn()
    expect(await authenticate(req(), env, (() => ({ apiKeyOwner })) as never)).toBeNull()
    expect(apiKeyOwner).not.toHaveBeenCalled()
  })
})
