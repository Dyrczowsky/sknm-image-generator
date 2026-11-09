import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { pkLogos, sygnetByName } from './logos'
import { withPlaceholders } from './fallback'
import { LogoSlots } from './blocks/LogoSlots'
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

describe('logo PK: samo / z wydziałem', () => {
  it('sześć różnych plików (PK, + WIiM, + KMS) × (jasne, ciemne tło)', () => {
    const files = Object.values(pkLogos).flatMap((v) => [v.light, v.dark])
    expect(new Set(files).size).toBe(6)
  })

  it('stopka dostaje wybrane logo PK przed grafikami; nieznana wartość = samo PK', () => {
    expect(withPlaceholders({ graphics: ['g1'] }).logoSlots).toEqual([{ pk: 'pk' }, 'g1'])
    expect(withPlaceholders({ pkLogo: 'wiim', graphics: ['g1'] }).logoSlots).toEqual([{ pk: 'wiim' }, 'g1'])
    expect(withPlaceholders({ pkLogo: 'kms' }).logoSlots).toEqual([{ pk: 'kms' }])
    expect(withPlaceholders({ pkLogo: 'x' as never }).logoSlots).toEqual([{ pk: 'pk' }])
    expect(withPlaceholders({ pkLogo: 'wiim', showPkLogo: false, graphics: ['g1'] }).logoSlots).toEqual(['g1'])
  })

  it('LogoSlots rysuje wariant pod tło', () => {
    const html = renderToStaticMarkup(createElement(LogoSlots, { slots: [{ pk: 'wiim' }], variant: 'dark' }))
    expect(html).toContain(`src="${pkLogos.wiim.dark}"`)
  })
})
