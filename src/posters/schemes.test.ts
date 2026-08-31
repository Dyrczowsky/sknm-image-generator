import { describe, expect, it } from 'vitest'
import { SCHEME_LABELS, resolveScheme, schemes, schemesFor } from './schemes'
import { colors } from './theme'

describe('resolveScheme', () => {
  it('nieznany layout/schemat → pusty wynik', () => {
    const s = resolveScheme('nieistnieje', 'tez-nie')
    expect(s.cssVars).toEqual({})
    expect(s.sygnet).toBeUndefined()
    expect(s.logoVariant).toBeUndefined()
  })

  it('roleToVar: camelCase → --kebab, NON_CSS pomijane', () => {
    schemes.__probe = {
      default: { pageBg: '#000', badgeFill: '#111', wedgeBr: '#222', tri1: '#333', logoVariant: 'dark' },
    }
    const s = resolveScheme('__probe', undefined)
    expect(s.cssVars['--page-bg']).toBe('#000')
    expect(s.cssVars['--badge-fill']).toBe('#111')
    expect(s.cssVars['--wedge-br']).toBe('#222')
    expect(s.cssVars['--tri1']).toBe('#333')
    expect(s.cssVars['--logo-variant']).toBeUndefined()
    expect(s.logoVariant).toBe('dark')
    delete schemes.__probe
  })

  it('Ogłoszenie: czerń w trzech akcentach + okazjonalne', () => {
    const d = resolveScheme('ogloszenie', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.navy)
    expect(d.cssVars['--accent']).toBe(colors.lime)
    expect(d.sygnet).toBe('negatywny')

    const cz = resolveScheme('ogloszenie', 'czernZolta')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--accent']).toBe(colors.lime)
    expect(cz.cssVars['--page-text']).toBe(colors.cream)  // z default
    expect(cz.sygnet).toBe('negatywny')
    expect(cz.logoVariant).toBe('dark')                   // z default

    expect(resolveScheme('ogloszenie', 'czernPomaranczowa').cssVars['--accent']).toBe(colors.coral)
    expect(resolveScheme('ogloszenie', 'czernGranatowa').cssVars['--accent']).toBe(colors.navyLight)

    const zl = resolveScheme('ogloszenie', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.navy)     // z default
    expect(zl.cssVars['--accent']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('ogloszenie', 'okazjonalnySrebrny')
    expect(sr.cssVars['--accent']).toBe(colors.silver)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Gala (dwa schematy)', () => {
    const d = resolveScheme('gala', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.ink)
    expect(d.cssVars['--gold']).toBe(colors.gold)
    expect(d.cssVars['--panel-br']).toBe(colors.inkPanel)
    expect(d.sygnet).toBe('zloty')

    const sr = resolveScheme('gala', 'okazjonalnySrebrny')
    expect(sr.cssVars['--gold']).toBe(colors.silver)    // rola --gold niesie srebro
    expect(sr.cssVars['--page-bg']).toBe(colors.ink)    // z bazy
    expect(sr.sygnet).toBe('srebrny')
    expect(sr.logoVariant).toBe('dark')
  })

  it('Gość: brak osobnego schematu gala; okazjonalne na tle ink', () => {
    const d = resolveScheme('gosc', undefined)
    expect(d.cssVars['--accent']).toBe(colors.navy)
    expect(d.sygnet).toBe('negatywny')
    expect(schemesFor('gosc')).not.toContain('gala')

    const cz = resolveScheme('gosc', 'czernPomaranczowa')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--accent']).toBe(colors.coral)
    expect(cz.cssVars['--muted-text']).toBe(colors.creamMuted)
    expect(cz.sygnet).toBe('negatywny')

    // Gość rysuje sygnet NA trójkącie akcentu, więc metaliczny akcent zniknąłby
    // pod złotym/srebrnym sygnetem — dlatego `okazjonalne` trzymają `accent`
    // równy tłu (ink), a metal niesie sam sygnet.
    const zl = resolveScheme('gosc', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.ink)
    expect(zl.cssVars['--accent']).toBe(colors.ink)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('gosc', 'okazjonalnySrebrny')
    expect(sr.cssVars['--accent']).toBe(colors.ink)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Data: czerń bez zmian, dochodzi okazjonalny srebrny', () => {
    const d = resolveScheme('data', undefined)
    expect(d.cssVars['--page-text']).toBe(colors.navy)
    expect(d.cssVars['--tri2']).toBe(colors.lime)

    const cz = resolveScheme('data', 'czern')
    expect(cz.cssVars['--tri1']).toBe(colors.lime)
    expect(cz.sygnet).toBe('negatywny')

    const zl = resolveScheme('data', 'okazjonalnyZloty')
    expect(zl.cssVars['--tri1']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('data', 'okazjonalnySrebrny')
    expect(sr.cssVars['--tri1']).toBe(colors.silver)
    expect(sr.cssVars['--tri2']).toBe(colors.coral)
    expect(sr.sygnet).toBe('srebrny')
    expect(sr.logoVariant).toBe('dark')
  })

  it('Wykład: trzy czernie + okazjonalne', () => {
    const d = resolveScheme('wyklad', undefined)
    expect(d.cssVars['--badge-fill']).toBe(colors.lime)
    expect(d.cssVars['--wedge-bl']).toBe(colors.navyDark)

    const cz = resolveScheme('wyklad', 'czernZolta')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--badge-fill']).toBe(colors.lime)
    expect(cz.cssVars['--wedge-br']).toBe('#1E1E1E')
    expect(cz.sygnet).toBe('negatywny')

    expect(resolveScheme('wyklad', 'czernPomaranczowa').cssVars['--speaker']).toBe(colors.coral)
    expect(resolveScheme('wyklad', 'czernGranatowa').cssVars['--chips']).toBe(colors.navyLight)

    const zl = resolveScheme('wyklad', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.black)
    expect(zl.cssVars['--speaker']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('wyklad', 'okazjonalnySrebrny')
    expect(sr.cssVars['--badge-fill']).toBe(colors.silver)
    expect(sr.cssVars['--badge-text']).toBe(colors.ink)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Konferencja: trzy czernie + okazjonalne', () => {
    const d = resolveScheme('konferencja', undefined)
    expect(d.cssVars['--panel']).toBe(colors.navy)
    expect(d.cssVars['--line-rest']).toBe(colors.creamMuted)

    const cz = resolveScheme('konferencja', 'czernZolta')
    expect(cz.cssVars['--panel']).toBe(colors.inkPanel)
    expect(cz.cssVars['--header-badge']).toBe(colors.lime)
    expect(cz.cssVars['--line-rest']).toBe('rgba(244,242,237,.2)')
    expect(cz.cssVars['--panel-text']).toBe(colors.cream)   // z default
    expect(cz.sygnet).toBe('negatywny')

    expect(resolveScheme('konferencja', 'czernPomaranczowa').cssVars['--footer-badge']).toBe(colors.coral)
    expect(resolveScheme('konferencja', 'czernGranatowa').cssVars['--line-first']).toBe(colors.navyLight)

    const zl = resolveScheme('konferencja', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.navy)
    expect(zl.cssVars['--header-badge']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('konferencja', 'okazjonalnySrebrny')
    expect(sr.cssVars['--header-badge']).toBe(colors.silver)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Rekrutacja (baza = limonka): trzy czernie + okazjonalne, bez pełnozłotego tła', () => {
    const li = resolveScheme('rekrutacja', 'limonka')
    expect(li.cssVars['--page-bg']).toBe(colors.lime)
    expect(li.cssVars['--band']).toBe(colors.navy)

    expect(schemesFor('rekrutacja')).not.toContain('zloto')

    const cz = resolveScheme('rekrutacja', 'czernZolta')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--band']).toBe(colors.lime)
    expect(cz.sygnet).toBe('negatywny')

    expect(resolveScheme('rekrutacja', 'czernPomaranczowa').cssVars['--band']).toBe(colors.coral)
    expect(resolveScheme('rekrutacja', 'czernPomaranczowa').cssVars['--footer-text']).toBe(colors.limeText)
    expect(resolveScheme('rekrutacja', 'czernGranatowa').cssVars['--band']).toBe(colors.navyLight)

    const zl = resolveScheme('rekrutacja', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.black)
    expect(zl.cssVars['--band']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('rekrutacja', 'okazjonalnySrebrny')
    expect(sr.cssVars['--band']).toBe(colors.silver)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Warsztat: trzy czernie + okazjonalne', () => {
    const d = resolveScheme('warsztat', undefined)
    expect(d.cssVars['--pill-fill']).toBe(colors.lime)

    const cz = resolveScheme('warsztat', 'czernZolta')
    expect(cz.cssVars['--slot-bg']).toBe(colors.black)
    expect(cz.cssVars['--pill-fill']).toBe(colors.lime)
    expect(cz.cssVars['--qr-border']).toBe('rgba(244,242,237,.3)')
    expect(cz.sygnet).toBe('negatywny')

    expect(resolveScheme('warsztat', 'czernPomaranczowa').cssVars['--badge-fill']).toBe(colors.coral)
    expect(resolveScheme('warsztat', 'czernGranatowa').cssVars['--pill-fill']).toBe(colors.navyLight)

    const zl = resolveScheme('warsztat', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.navy)
    expect(zl.cssVars['--badge-fill']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('warsztat', 'okazjonalnySrebrny')
    expect(sr.cssVars['--pill-fill']).toBe(colors.silver)
    expect(sr.cssVars['--pill-text']).toBe(colors.ink)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('invariant: każdy layout ma niepustą listę schematów; każdy (z bazą włącznie) zwraca sygnet + logoVariant + niepusty cssVars', () => {
    for (const layout of Object.keys(schemes)) {
      const names = schemesFor(layout)
      expect(names.length, `${layout}: brak schematów`).toBeGreaterThan(0)
      for (const name of [undefined, ...names]) {
        const s = resolveScheme(layout, name)
        expect(s.sygnet, `${layout}/${name}: brak sygnet`).toBeTruthy()
        expect(['light', 'dark'], `${layout}/${name}: zły logoVariant`).toContain(s.logoVariant)
        expect(Object.keys(s.cssVars).length, `${layout}/${name}: pusty cssVars`).toBeGreaterThan(0)
      }
    }
  })

  it('invariant: gold tylko z sygnetem zloty, silver tylko ze srebrny', () => {
    for (const layout of Object.keys(schemes)) {
      for (const name of [undefined, ...schemesFor(layout)]) {
        const s = resolveScheme(layout, name)
        const vals = Object.values(s.cssVars).map((v) => v.toLowerCase())
        if (vals.includes(colors.gold.toLowerCase()))
          expect(s.sygnet, `${layout}/${name}: gold bez sygnetu zloty`).toBe('zloty')
        if (vals.includes(colors.silver.toLowerCase()))
          expect(s.sygnet, `${layout}/${name}: silver bez sygnetu srebrny`).toBe('srebrny')
      }
    }
  })
})

it('SCHEME_LABELS', () => {
  expect(SCHEME_LABELS.czern).toBe('Czerń')
  expect(SCHEME_LABELS.czernZolta).toBe('Czerń żółta')
  expect(SCHEME_LABELS.okazjonalnyZloty).toBe('Okazjonalny złoty')
  expect(SCHEME_LABELS.okazjonalnySrebrny).toBe('Okazjonalny srebrny')
  expect(SCHEME_LABELS.zloto).toBeUndefined()
})
