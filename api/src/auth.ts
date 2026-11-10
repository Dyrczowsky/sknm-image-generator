import { createHash, timingSafeEqual } from 'node:crypto'

// Klucz z nagłówka `Authorization: Bearer <klucz>` albo z segmentu ścieżki `/mcp/<klucz>`.
export function keyFrom(request: Request): string | null {
  const header = request.headers.get('Authorization')
  const bearer = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (bearer) return bearer
  const path = /^\/mcp\/([^/]+)\/?$/.exec(new URL(request.url).pathname)?.[1]
  if (!path) return null
  try {
    return decodeURIComponent(path)
  } catch {
    return null
  }
}

const sha256 = (value: string) => createHash('sha256').update(value).digest()

// Porównanie w stałym czasie na skrótach SHA-256 (równa długość, brak wczesnego wyjścia).
export function keyMatches(given: string | null, expected: string): boolean {
  if (!given || !expected) return false
  return timingSafeEqual(sha256(given), sha256(expected))
}
