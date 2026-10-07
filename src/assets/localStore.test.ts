import { describe, expect, it } from 'vitest'
import { createLocalStore } from './localStore'
import type { KeyValueStore, LocalAsset } from './localStore'

const REF = `${'a'.repeat(64)}.png`
const OTHER = `${'b'.repeat(64)}.jpg`

function memoryKv() {
  const map = new Map<string, unknown>()
  const kv: KeyValueStore = {
    get: async (key) => map.get(key),
    set: async (key, value) => void map.set(key, value),
    del: async (key) => void map.delete(key),
    keys: async () => [...map.keys()],
  }
  return { kv, map }
}

const asset = (overrides: Partial<LocalAsset> = {}): LocalAsset => ({ blob: new Blob(['x'], { type: 'image/png' }), remote: false, kind: 'logo', name: 'logo.png', ...overrides })

describe('createLocalStore', () => {
  it('zapisuje pod kluczem sknm-asset:<nazwa> i odczytuje z powrotem', async () => {
    const { kv, map } = memoryKv()
    const store = createLocalStore(kv)
    const stored = asset()
    await store.put(REF, stored)
    expect([...map.keys()]).toEqual([`sknm-asset:${REF}`])
    expect(await store.get(REF)).toBe(stored)
    expect(await store.get(OTHER)).toBeUndefined()
  })

  it('markRemote zmienia tylko znacznik', async () => {
    const { kv } = memoryKv()
    const store = createLocalStore(kv)
    const stored = asset({ kind: 'photo', name: 'foto.jpg' })
    await store.put(REF, stored)
    await store.markRemote(REF)
    expect(await store.get(REF)).toEqual({ ...stored, remote: true })
  })

  it('markRemote dla nieznanej grafiki nic nie zapisuje', async () => {
    const { kv, map } = memoryKv()
    await createLocalStore(kv).markRemote(REF)
    expect(map.size).toBe(0)
  })

  it('refs pomija cudze klucze, remove usuwa', async () => {
    const { kv, map } = memoryKv()
    map.set('sknm-image-generator-db', new Uint8Array())
    map.set('sknm-workspace', {})
    const store = createLocalStore(kv)
    await store.put(REF, asset())
    await store.put(OTHER, asset())
    expect((await store.refs()).sort()).toEqual([REF, OTHER])
    await store.remove(REF)
    expect(await store.refs()).toEqual([OTHER])
    expect(map.has('sknm-workspace')).toBe(true)
  })
})
