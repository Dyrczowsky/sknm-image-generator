import { describe, expect, it } from 'vitest'
import { registerRichField, richFieldFor } from './fieldRegistry'
import type { RichFieldHandle } from './fieldRegistry'

const handle: RichFieldHandle = {
  applyFormat: () => {},
  state: () => ({ marks: 0, align: null, alignable: false }),
}

// Węzły jako zwykłe obiekty z parentNode - tylko tego używa rejestr.
const field = { parentNode: null } as unknown as HTMLElement
const child = { parentNode: { parentNode: field } } as unknown as Node

describe('fieldRegistry', () => {
  it('richFieldFor znajduje najbliższe zarejestrowane pole w górę drzewa', () => {
    const unregister = registerRichField(field, handle)
    expect(richFieldFor(child)).toEqual({ el: field, handle })
    expect(richFieldFor(field)).toEqual({ el: field, handle })
    unregister()
    expect(richFieldFor(child)).toBeNull()
  })

  it('brak węzła albo pola: null', () => {
    expect(richFieldFor(null)).toBeNull()
    expect(richFieldFor({ parentNode: null } as unknown as Node)).toBeNull()
  })

  it('wyrejestrowanie starego uchwytu nie usuwa nowego', () => {
    const unregisterOld = registerRichField(field, handle)
    const fresh = { ...handle }
    const unregisterNew = registerRichField(field, fresh)
    unregisterOld()
    expect(richFieldFor(field)?.handle).toBe(fresh)
    unregisterNew()
  })
})
