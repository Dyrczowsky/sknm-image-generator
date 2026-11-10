import { describe, expect, it } from 'vitest'
import { keyFrom, keyMatches } from './auth'

describe('keyFrom', () => {
  it('czyta klucz z nagłówka Bearer', () => {
    const r = new Request('https://x.test/render', { headers: { Authorization: 'Bearer abc123' } })
    expect(keyFrom(r)).toBe('abc123')
  })
  it('czyta klucz ze ścieżki /mcp/<klucz>', () => {
    expect(keyFrom(new Request('https://x.test/mcp/abc123'))).toBe('abc123')
  })
  it('nagłówek ma pierwszeństwo przed ścieżką', () => {
    const r = new Request('https://x.test/mcp/zly', { headers: { Authorization: 'Bearer dobry' } })
    expect(keyFrom(r)).toBe('dobry')
  })
  it('brak klucza daje null', () => {
    expect(keyFrom(new Request('https://x.test/render'))).toBeNull()
    expect(keyFrom(new Request('https://x.test/mcp'))).toBeNull()
    expect(keyFrom(new Request('https://x.test/render', { headers: { Authorization: 'Bearer ' } }))).toBeNull()
  })
})

describe('keyMatches', () => {
  it('zgodny klucz', () => expect(keyMatches('sekret', 'sekret')).toBe(true))
  it('zły, pusty i brakujący klucz', () => {
    expect(keyMatches('inny', 'sekret')).toBe(false)
    expect(keyMatches('sekre', 'sekret')).toBe(false)
    expect(keyMatches('', 'sekret')).toBe(false)
    expect(keyMatches(null, 'sekret')).toBe(false)
    expect(keyMatches('', '')).toBe(false)
  })
})
