import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NARROW_OFFSCREEN, NARROW_QUERY } from './styles'

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(ts|tsx)$/.test(name) && name !== 'styles.test.ts' ? [path] : []
  })
}

describe('granica układu 900 px', () => {
  it('zapytanie JS jest dopełnieniem `min-[900px]:` (Tailwind 4: `not all and (width >= 900px)`)', () => {
    expect(NARROW_QUERY).toBe('not all and (min-width: 900px)')
  })

  it('klasy „wąsko" używają `max-[900px]:`, nigdzie nie ma `max-[899px]:` (luka 899-900 px)', () => {
    expect(NARROW_OFFSCREEN).toContain('max-[900px]:fixed')
    const offenders = sources(new URL('..', import.meta.url).pathname).filter((file) => /max-\[899/.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })
})
