import { describe, expect, it } from 'vitest'
import { SCHEME_LABELS, resolveScheme, schemes } from './schemes'
import { colors } from './theme'

describe('resolveScheme', () => {
  it('nieznany layout/schemat → pusty wynik', () => {
    const s = resolveScheme('nieistnieje', 'tez-nie')
    expect(s.cssVars).toEqual({})
    expect(s.sygnet).toBeUndefined()
    expect(s.logoVariant).toBeUndefined()
  })

  it('roleToVar: camelCase → --kebab, NON_CSS pomijane', () => {
    ;(schemes as Record<string, unknown>).__probe = {
      default: { pageBg: '#000', badgeFill: '#111', wedgeBr: '#222', tri1: '#333', logoVariant: 'dark' },
    }
    const s = resolveScheme('__probe', undefined)
    expect(s.cssVars['--page-bg']).toBe('#000')
    expect(s.cssVars['--badge-fill']).toBe('#111')
    expect(s.cssVars['--wedge-br']).toBe('#222')
    expect(s.cssVars['--tri1']).toBe('#333')
    expect(s.cssVars['--logo-variant']).toBeUndefined() // NON_CSS
    expect(s.logoVariant).toBe('dark')
    delete (schemes as Record<string, unknown>).__probe
  })

  it('Ogłoszenie: nadpisania + dziedziczenie z default', () => {
    const d = resolveScheme('ogloszenie', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.navy)
    expect(d.cssVars['--accent']).toBe(colors.lime)
    expect(d.sygnet).toBe('negatywny')
    const cz = resolveScheme('ogloszenie', 'czern')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--accent']).toBe(colors.gold)
    expect(cz.cssVars['--page-text']).toBe(colors.cream) // z default
    expect(cz.logoVariant).toBe('dark')                  // z default
    const zl = resolveScheme('ogloszenie', 'zloto')
    expect(zl.cssVars['--page-bg']).toBe(colors.navy)    // z default
    expect(zl.sygnet).toBe('zloty')
  })

  it('Gala (jeden schemat)', () => {
    const d = resolveScheme('gala', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.ink)
    expect(d.cssVars['--gold']).toBe(colors.gold)
    expect(d.cssVars['--panel-br']).toBe(colors.inkPanel)
    expect(d.sygnet).toBe('zloty')
  })

  it('Gość', () => {
    const d = resolveScheme('gosc', undefined)
    expect(d.cssVars['--accent']).toBe(colors.navy)
    expect(d.sygnet).toBe('negatywny')
    const cz = resolveScheme('gosc', 'czern')
    expect(cz.cssVars['--accent']).toBe(colors.gold)
    expect(cz.sygnet).toBe('negatywny')   // Gość: czerń zostaje przy negatywnym
    expect(cz.cssVars['--muted-text']).toBe(colors.creamMuted)
    const ja = resolveScheme('gosc', 'jasny')
    expect(ja.cssVars['--page-bg']).toBe(colors.paper)
    expect(ja.cssVars['--accent']).toBe(colors.navy)          // z default
    expect(ja.cssVars['--muted-text']).toBe(colors.textMuted) // z default
    const sz = resolveScheme('gosc', 'szary')
    expect(sz.cssVars['--page-text']).toBe(colors.slate)
    expect(sz.cssVars['--muted-text']).toBe(colors.textMuted) // szary NIE nadpisuje
  })

  it('Data', () => {
    const d = resolveScheme('data', undefined)
    expect(d.cssVars['--page-text']).toBe(colors.navy)   // Data default: tekst granatowy
    expect(d.cssVars['--tri2']).toBe(colors.lime)
    const sz = resolveScheme('data', 'szary')
    expect(sz.cssVars['--tri3']).toBe(colors.coral)      // szary nie nadpisuje tri3
    expect(sz.cssVars['--tri1']).toBe(colors.grayDark)
    const ja = resolveScheme('data', 'jasny')
    expect(ja.cssVars['--title']).toBe(colors.ink)       // z default
  })

  it('Wykład', () => {
    const d = resolveScheme('wyklad', undefined)
    expect(d.cssVars['--badge-fill']).toBe(colors.lime)
    expect(d.cssVars['--badge-text']).toBe(colors.limeText)
    expect(d.cssVars['--wedge-bl']).toBe(colors.navyDark)
    const zl = resolveScheme('wyklad', 'zloto')
    expect(zl.cssVars['--page-bg']).toBe(colors.navy)          // z default (zloto = navy)
    expect(zl.cssVars['--wedge-br']).toBe(colors.navyLight)    // z default
    expect(zl.cssVars['--speaker']).toBe(colors.cream)
    const cz = resolveScheme('wyklad', 'czern')
    expect(cz.cssVars['--wedge-bl']).toBe('#0A0A0A')
    expect(cz.sygnet).toBe('negatywny')                        // Wykład czerń: negatyw, nie złoto
  })

  it('Konferencja', () => {
    const d = resolveScheme('konferencja', undefined)
    expect(d.cssVars['--panel']).toBe(colors.navy)
    expect(d.cssVars['--line-rest']).toBe(colors.creamMuted)
    const cz = resolveScheme('konferencja', 'czern')
    expect(cz.cssVars['--panel']).toBe(colors.inkPanel)
    expect(cz.cssVars['--line-rest']).toBe('rgba(244,242,237,.2)')
    expect(cz.cssVars['--panel-text']).toBe(colors.cream)   // z default
    const ja = resolveScheme('konferencja', 'jasny')
    expect(ja.cssVars['--panel']).toBe(colors.navy)         // z default
    const sz = resolveScheme('konferencja', 'szary')
    expect(sz.cssVars['--line-rest']).toBe(colors.creamMuted) // szary nie nadpisuje
  })

  it('Rekrutacja (default = limonka)', () => {
    const li = resolveScheme('rekrutacja', 'limonka')
    expect(li.cssVars['--page-bg']).toBe(colors.lime)
    expect(li.cssVars['--band']).toBe(colors.navy)
    const zl = resolveScheme('rekrutacja', 'zloto')
    expect(zl.cssVars['--page-bg']).toBe(colors.gold)
    expect(zl.cssVars['--footer-text']).toBe(colors.cream)             // z limonka
    expect(zl.cssVars['--qr-border']).toBe('rgba(244,242,237,.55)')    // z limonka
    expect(zl.logoVariant).toBe('dark')                                // z limonka
    const cz = resolveScheme('rekrutacja', 'czern')
    expect(cz.cssVars['--qr-border']).toBe('rgba(18,18,18,.4)')
    expect(cz.logoVariant).toBe('light')
  })

  it('Warsztat', () => {
    const d = resolveScheme('warsztat', undefined)
    expect(d.cssVars['--pill-fill']).toBe(colors.lime)
    expect(d.cssVars['--qr-border']).toBe(colors.placeholderBorder)
    const ja = resolveScheme('warsztat', 'jasny')
    expect(ja.cssVars['--page-bg']).toBe(colors.paper)
    expect(ja.cssVars['--slot-bg']).toBe(colors.paper)
    expect(ja.cssVars['--badge-fill']).toBe(colors.navy)     // z default
    expect(ja.cssVars['--pill-text']).toBe(colors.limeText)  // z default
    expect(ja.sygnet).toBe('granat')                         // z default
    const cz = resolveScheme('warsztat', 'czern')
    expect(cz.cssVars['--slot-bg']).toBe(colors.black)
    expect(cz.cssVars['--qr-border']).toBe('rgba(244,242,237,.3)')
  })

  it('invariant: każdy layout ma default; każda para zwraca sygnet + logoVariant + niepusty cssVars', () => {
    for (const layout of Object.keys(schemes)) {
      const names = Object.keys(schemes[layout])
      expect(names, `${layout}: brak bloku default`).toContain('default')
      for (const name of names) {
        const s = resolveScheme(layout, name)
        expect(s.sygnet, `${layout}/${name}: brak sygnet`).toBeTruthy()
        expect(['light', 'dark'], `${layout}/${name}: zły logoVariant`).toContain(s.logoVariant)
        expect(Object.keys(s.cssVars).length, `${layout}/${name}: pusty cssVars`).toBeGreaterThan(0)
      }
    }
  })
})

it('SCHEME_LABELS', () => {
  expect(SCHEME_LABELS.czern).toBe('Czerń')
})
