import { describe, expect, it, vi } from 'vitest'
import { isAiAuthor } from '../assets/remoteLibrary'
import { API_URL, mcpCommand, regenerateApiKey, revokeApiKey } from './apiKey'

describe('apiKey', () => {
  it('nowy klucz z funkcji bazy; błąd idzie dalej', async () => {
    const rpc = vi.fn(async () => ({ data: 'sknm_x', error: null }))
    expect(await regenerateApiKey({ rpc } as never)).toBe('sknm_x')
    expect(rpc).toHaveBeenCalledWith('sknm_regenerate_api_key')
    const denied = { rpc: async () => ({ data: null, error: { message: 'Tylko członkowie' } }) }
    await expect(regenerateApiKey(denied as never)).rejects.toThrow('Tylko członkowie')
  })
  it('usuwa tylko własny wiersz', async () => {
    const eq = vi.fn(async () => ({ error: null }))
    const from = vi.fn(() => ({ delete: () => ({ eq }) }))
    await revokeApiKey({ from } as never, 'u1')
    expect(from).toHaveBeenCalledWith('sknm_api_keys')
    expect(eq).toHaveBeenCalledWith('user_id', 'u1')
  })
  it('polecenie Claude Code: klucz w nagłówku, adres /mcp bez klucza', () => {
    expect(mcpCommand('sknm_k')).toBe(`claude mcp add --transport http --scope user sknm ${API_URL}/mcp --header "Authorization: Bearer sknm_k"`)
  })
  it('autor AI: „AI" i „AI · e-mail", ale nie e-mail zaczynający się od „AI"', () => {
    expect(isAiAuthor('AI')).toBe(true)
    expect(isAiAuthor('AI · ola@sknm.pl')).toBe(true)
    expect(isAiAuthor('AIko@sknm.pl')).toBe(false)
  })
})
