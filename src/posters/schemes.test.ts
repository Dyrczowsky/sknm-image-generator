import { describe, expect, it } from 'vitest'
import {
  ACCENT_LABELS,
  ACCENT_NAMES,
  SCHEME_LABELS,
  accentsFor,
  resolveScheme,
  schemes,
  schemesFor,
} from './schemes'
import { colors } from './theme'
import type { AccentName } from '../types'

describe('resolveScheme — baza (bez akcentu)', () => {
  it('nieznany layout/schemat → pusty wynik', () => {
    const s = resolveScheme('nieistnieje', 'tez-nie')
    expect(s.cssVars).toEqual({})
    expect(s.sygnet).toBeUndefined()
    expect(s.logoVariant).toBeUndefined()
  })

  it('roleToVar: camelCase → --kebab, NON_CSS pomijane', () => {
    schemes.__probe = { default: { pageBg: '#000', badgeFill: '#111', tri1: '#333', logoVariant: 'dark' } }
    const s = resolveScheme('__probe', undefined)
    expect(s.cssVars['--page-bg']).toBe('#000')
    expect(s.cssVars['--badge-fill']).toBe('#111')
    expect(s.cssVars['--tri1']).toBe('#333')
    expect(s.cssVars['--logo-variant']).toBeUndefined()
    expect(s.logoVariant).toBe('dark')
    delete schemes.__probe
  })

  it('Ogłoszenie: default + czern + jasny + szary', () => {
    expect(schemesFor('ogloszenie')).toEqual(['default', 'czern', 'jasny', 'szary'])
    const d = resolveScheme('ogloszenie', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.navy)
    expect(d.cssVars['--accent']).toBe(colors.lime)
    const cz = resolveScheme('ogloszenie', 'czern')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--accent']).toBe(colors.lime)          // żółty wbudowany
    expect(cz.cssVars['--page-text']).toBe(colors.cream)      // z default
    expect(cz.sygnet).toBe('negatywny')
    expect(cz.logoVariant).toBe('dark')
  })

  it('Gala: jeden schemat default (ink, złoto, sygnet zloty)', () => {
    expect(schemesFor('gala')).toEqual(['default'])
    const d = resolveScheme('gala', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.ink)
    expect(d.cssVars['--gold']).toBe(colors.gold)
    expect(d.sygnet).toBe('zloty')
  })

  it('Data: bez zmian, 6 schematów', () => {
    expect(schemesFor('data')).toEqual(['default', 'czern', 'okazjonalnyZloty', 'okazjonalnySrebrny', 'jasny', 'szary'])
    expect(resolveScheme('data', 'okazjonalnyZloty').cssVars['--tri1']).toBe(colors.gold)
    expect(resolveScheme('data', 'okazjonalnyZloty').sygnet).toBe('zloty')
  })

  it('Rekrutacja: baza limonka, klucze limonka/czern/jasny/szary', () => {
    expect(schemesFor('rekrutacja')).toEqual(['limonka', 'czern', 'jasny', 'szary'])
    expect(resolveScheme('rekrutacja', 'limonka').cssVars['--band']).toBe(colors.navy)
    expect(resolveScheme('rekrutacja', 'czern').cssVars['--band']).toBe(colors.lime)   // żółty wbudowany
  })
})

describe('accentsFor', () => {
  it('data → puste (kontrolka wyłączona)', () => {
    expect(accentsFor('data')).toEqual([])
  })
  it('layouty z receptą → 5 akcentów', () => {
    for (const l of ['ogloszenie', 'gosc', 'wyklad', 'konferencja', 'rekrutacja', 'warsztat', 'gala']) {
      expect(accentsFor(l)).toEqual(ACCENT_NAMES)
    }
  })
  it('ACCENT_LABELS ma polskie podpisy', () => {
    expect(ACCENT_LABELS.zolty).toBe('Żółty')
    expect(ACCENT_LABELS.zloty).toBe('Złoty (okazjonalny)')
  })
})

describe('resolveScheme — z akcentem', () => {
  it('Wykład Czerń × akcenty — role plakietki', () => {
    expect(resolveScheme('wyklad', 'czern', 'zolty').cssVars['--badge-fill']).toBe(colors.lime)
    expect(resolveScheme('wyklad', 'czern', 'pomaranczowy').cssVars['--badge-fill']).toBe(colors.coral)
    expect(resolveScheme('wyklad', 'czern', 'pomaranczowy').cssVars['--speaker']).toBe(colors.coral)
    expect(resolveScheme('wyklad', 'czern', 'granatowy').cssVars['--chips']).toBe(colors.navyLight)
    const zl = resolveScheme('wyklad', 'czern', 'zloty')
    expect(zl.cssVars['--badge-fill']).toBe(colors.gold)
    expect(zl.cssVars['--badge-text']).toBe(colors.cream)
    expect(zl.sygnet).toBe('zloty')
    const sr = resolveScheme('wyklad', 'czern', 'srebrny')
    expect(sr.cssVars['--badge-text']).toBe(colors.ink)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Gość: metaliczny akcent dokłada sygnetBg (granat)', () => {
    expect(resolveScheme('gosc', 'czern', 'zloty').cssVars['--sygnet-bg']).toBe(colors.navy)
    expect(resolveScheme('gosc', 'czern', 'srebrny').cssVars['--sygnet-bg']).toBe(colors.navy)
    expect(resolveScheme('gosc', 'czern', 'pomaranczowy').cssVars['--sygnet-bg']).toBeUndefined()
  })

  it('granatowy: navyLight na ciemnym tle, navy na jasnym', () => {
    expect(resolveScheme('ogloszenie', 'czern', 'granatowy').cssVars['--accent']).toBe(colors.navyLight)
    expect(resolveScheme('ogloszenie', 'jasny', 'granatowy').cssVars['--accent']).toBe(colors.navy)
  })

  it('Gala × akcent: rola --gold niesie kolor akcentu, sygnet dopasowany', () => {
    expect(resolveScheme('gala', 'default', 'granatowy').cssVars['--gold']).toBe(colors.navyLight)
    expect(resolveScheme('gala', 'default', 'granatowy').sygnet).toBe('negatywny')
    expect(resolveScheme('gala', 'default', 'srebrny').cssVars['--gold']).toBe(colors.silver)
    expect(resolveScheme('gala', 'default', 'srebrny').sygnet).toBe('srebrny')
  })

  it('Rekrutacja × akcent: banda + logoVariant', () => {
    expect(resolveScheme('rekrutacja', 'czern', 'granatowy').cssVars['--band']).toBe(colors.navyLight)
    expect(resolveScheme('rekrutacja', 'czern', 'granatowy').logoVariant).toBe('dark')
    expect(resolveScheme('rekrutacja', 'czern', 'zloty').cssVars['--band']).toBe(colors.gold)
    expect(resolveScheme('rekrutacja', 'czern', 'zloty').logoVariant).toBe('light')
    expect(resolveScheme('rekrutacja', 'czern', 'zloty').sygnet).toBe('zloty')
  })

  it('data ignoruje akcent (brak recepty)', () => {
    const a = resolveScheme('data', 'czern', 'zloty')
    const b = resolveScheme('data', 'czern', undefined)
    expect(a.cssVars).toEqual(b.cssVars)
    expect(a.sygnet).toBe(b.sygnet)
  })
})

describe('invarianty', () => {
  const layoutsAndSchemes = () =>
    Object.keys(schemes).flatMap((layout) =>
      [undefined, ...schemesFor(layout)].map((name) => ({ layout, name })),
    )
  const accents: (AccentName | undefined)[] = [undefined, ...ACCENT_NAMES]

  it('każdy layout × schemat × akcent: sygnet + logoVariant + niepusty cssVars', () => {
    for (const { layout, name } of layoutsAndSchemes()) {
      for (const acc of accents) {
        const s = resolveScheme(layout, name, acc)
        expect(s.sygnet, `${layout}/${name}/${acc}: brak sygnet`).toBeTruthy()
        expect(['light', 'dark'], `${layout}/${name}/${acc}: zły logoVariant`).toContain(s.logoVariant)
        expect(Object.keys(s.cssVars).length, `${layout}/${name}/${acc}: pusty cssVars`).toBeGreaterThan(0)
      }
    }
  })

  it('gold tylko z sygnetem zloty, silver tylko ze srebrny — po nałożeniu akcentu', () => {
    for (const { layout, name } of layoutsAndSchemes()) {
      for (const acc of accents) {
        const s = resolveScheme(layout, name, acc)
        const vals = Object.values(s.cssVars).map((v) => v.toLowerCase())
        if (vals.includes(colors.gold.toLowerCase()))
          expect(s.sygnet, `${layout}/${name}/${acc}: gold bez sygnetu zloty`).toBe('zloty')
        if (vals.includes(colors.silver.toLowerCase()))
          expect(s.sygnet, `${layout}/${name}/${acc}: silver bez sygnetu srebrny`).toBe('srebrny')
      }
    }
  })
})

it('SCHEME_LABELS', () => {
  expect(SCHEME_LABELS.czern).toBe('Czerń')
  expect(SCHEME_LABELS.default).toBe('Granat')
  expect(SCHEME_LABELS.czernZolta).toBeUndefined()
  expect(SCHEME_LABELS.okazjonalnyZloty).toBe('Okazjonalny złoty')   // nadal dla Daty
})
