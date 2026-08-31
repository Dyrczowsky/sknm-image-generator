import { describe, expect, it } from 'vitest'
import { sygnetByName } from './logos'
import type { SygnetName } from '../types'

describe('sygnetByName', () => {
  it('ma wpis dla każdej nazwy sygnetu, w tym srebrny', () => {
    const names: SygnetName[] = ['negatywny', 'granat', 'zloty', 'szary', 'czarny', 'srebrny']
    for (const n of names) {
      expect(sygnetByName[n], `brak sygnetu: ${n}`).toBeTruthy()
      expect(typeof sygnetByName[n]).toBe('string')
    }
  })

  it('srebrny to inny plik niż szary i zloty', () => {
    expect(sygnetByName.srebrny).not.toBe(sygnetByName.szary)
    expect(sygnetByName.srebrny).not.toBe(sygnetByName.zloty)
  })
})
