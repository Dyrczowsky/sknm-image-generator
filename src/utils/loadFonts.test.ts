import { describe, expect, it } from 'vitest'
import { loadAllFonts } from './loadFonts'
import type { FontSet } from './loadFonts'

const fakeSet = (faces: { load: () => Promise<FontFace> }[], log: string[]): FontSet =>
  Object.assign(faces, { ready: Promise.resolve().then(() => { log.push('ready') }) as unknown as Promise<FontFaceSet> })

describe('loadAllFonts', () => {
  it('ładuje każdy krój i czeka na nie przed zakończeniem', async () => {
    const log: string[] = []
    const face = (name: string) => ({ load: () => new Promise<FontFace>((r) => setTimeout(() => { log.push(name); r({} as FontFace) }, 5)) })
    await loadAllFonts(fakeSet([face('a'), face('b')], log))
    expect(log).toContain('a')
    expect(log).toContain('b')
  })

  it('krój, który się nie wczytał, nie blokuje gotowości', async () => {
    const log: string[] = []
    const broken = { load: () => Promise.reject(new Error('404')) }
    await expect(loadAllFonts(fakeSet([broken], log))).resolves.toBeUndefined()
  })
})
