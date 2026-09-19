import { describe, expect, it } from 'vitest'
import {
  ACCENT_LABELS,
  ACCENT_NAMES,
  SCHEME_LABELS,
  accentAllowed,
  accentsFor,
  defaultAccentFor,
  layoutHasAccentAxis,
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

describe('oś akcentu — dostępność per schemat', () => {
  it('layoutHasAccentAxis: Data nie, reszta tak', () => {
    expect(layoutHasAccentAxis('data')).toBe(false)
    for (const l of ['ogloszenie', 'gosc', 'wyklad', 'konferencja', 'rekrutacja', 'warsztat', 'gala']) {
      expect(layoutHasAccentAxis(l)).toBe(true)
    }
  })
  it('schemat „czern" (accents: all) → wszystkie 5; schemat stały → puste', () => {
    for (const l of ['ogloszenie', 'gosc', 'wyklad', 'konferencja', 'rekrutacja', 'warsztat']) {
      expect(accentsFor(l, 'czern')).toEqual(ACCENT_NAMES)
      expect(defaultAccentFor(l, 'czern')).toBe('zolty')
    }
    // stałe schematy (jasny/szary) — brak `accents`
    expect(accentsFor('ogloszenie', 'jasny')).toEqual([])
    expect(accentsFor('ogloszenie', 'szary')).toEqual([])
    // „Granat"/„Limonka" (default/limonka) — oś tam, gdzie recepta zolty/granatowy == blok
    expect(accentsFor('ogloszenie', 'default')).toEqual(['zolty', 'pomaranczowy', 'granatowy'])
    expect(accentsFor('konferencja', 'default')).toEqual(['zolty', 'pomaranczowy', 'granatowy'])
    expect(accentsFor('warsztat', 'default')).toEqual(['zolty', 'pomaranczowy', 'granatowy'])
    expect(accentsFor('rekrutacja', 'limonka')).toEqual(['zolty', 'pomaranczowy', 'granatowy'])
  })
  it('Gala: jedyny schemat `default` ma oś (accents: all)', () => {
    expect(accentsFor('gala', 'default')).toEqual(ACCENT_NAMES)
    expect(accentsFor('gala')).toEqual(ACCENT_NAMES)          // baza = default
    expect(defaultAccentFor('gala', 'default')).toBe('zloty')
  })
  it('Data: kontrolka wyłączona niezależnie od schematu', () => {
    expect(accentsFor('data')).toEqual([])
    expect(accentsFor('data', 'czern')).toEqual([])
  })
  it('każdy layout z receptą ma co najmniej jeden schemat z osią', () => {
    for (const layout of Object.keys(schemes)) {
      if (!layoutHasAccentAxis(layout)) continue
      const anyAxis = schemesFor(layout).some((s) => accentsFor(layout, s).length > 0)
      expect(anyAxis, `${layout}: recepta jest, ale żaden schemat nie ma osi`).toBe(true)
    }
  })
  it('accentAllowed', () => {
    expect(accentAllowed('wyklad', 'czern', undefined)).toBe(true)
    expect(accentAllowed('wyklad', 'czern', 'zloty')).toBe(true)
    expect(accentAllowed('wyklad', 'jasny', 'zloty')).toBe(false)   // schemat stały
    expect(accentAllowed('data', 'czern', 'zloty')).toBe(false)     // layout bez osi
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

  it('granatowy na czerni (ciemne tło) → navyLight', () => {
    expect(resolveScheme('ogloszenie', 'czern', 'granatowy').cssVars['--accent']).toBe(colors.navyLight)
  })

  it('schemat stały ignoruje akcent', () => {
    // „Jasny" nie ma osi — podanie akcentu nic nie zmienia, renderuje blok.
    expect(resolveScheme('ogloszenie', 'jasny', 'granatowy').cssVars['--accent']).toBe(colors.navy)
    expect(resolveScheme('wyklad', 'jasny', 'zloty').cssVars['--badge-fill']).toBe(colors.navy)
  })

  it('regresja: „czern" bez wyboru akcentu = to, co blok już miał wpisane', () => {
    // defaultAccent uruchamia receptę — jej wynik MUSI się zgadzać z wbudowanym
    // żółtym akcentem bloku, inaczej „Domyślny" po cichu zmienia wygląd.
    const rek = resolveScheme('rekrutacja', 'czern', undefined)
    expect(rek.cssVars['--band']).toBe(colors.lime)
    expect(rek.cssVars['--footer-text']).toBe(colors.limeText)
    expect(rek.cssVars['--badge-color']).toBe(colors.black)
    expect(rek.cssVars['--qr-border']).toBe('rgba(18,18,18,.4)')
    expect(rek.cssVars['--qr-text']).toBe('rgba(18,18,18,.6)')
    expect(rek.logoVariant).toBe('light')
    expect(rek.sygnet).toBe('negatywny')
    const kon = resolveScheme('konferencja', 'czern', undefined)
    expect(kon.cssVars['--header-badge']).toBe(colors.lime)
    expect(kon.cssVars['--line-first']).toBe(colors.lime)
    expect(kon.cssVars['--footer-badge']).toBe(colors.lime)
    expect(kon.cssVars['--line-rest']).toBe('rgba(244,242,237,.2)')
    const wy = resolveScheme('wyklad', 'czern', undefined)
    expect(wy.cssVars['--badge-fill']).toBe(colors.lime)
    expect(wy.cssVars['--badge-text']).toBe(colors.limeText)
    expect(wy.cssVars['--speaker']).toBe(colors.lime)
  })

  it('regresja: „Granat" (default) z osią — Domyślny renderuje tak jak blok', () => {
    // ogloszenie/wyklad/gosc.default dostały oś (3 akcenty). „Domyślny" nie
    // może zmienić ich dotychczasowego wyglądu.
    expect(accentsFor('ogloszenie', 'default')).toHaveLength(3)
    expect(resolveScheme('ogloszenie', 'default', undefined).cssVars['--accent']).toBe(colors.lime)
    expect(resolveScheme('wyklad', 'default', undefined).cssVars['--badge-fill']).toBe(colors.lime)
    expect(resolveScheme('gosc', 'default', undefined).cssVars['--accent']).toBe(colors.navy)
    // konferencja/warsztat.default i rekrutacja.limonka: „Domyślny" renderuje
    // dokładnie to, co blok miał wpisane na sztywno przed dołożeniem osi.
    expect(resolveScheme('konferencja', 'default', undefined).cssVars['--header-badge']).toBe(colors.lime)
    expect(resolveScheme('konferencja', 'default', undefined).cssVars['--line-first']).toBe(colors.navy)
    expect(resolveScheme('konferencja', 'default', undefined).cssVars['--footer-badge']).toBe(colors.navy)
    expect(resolveScheme('warsztat', 'default', undefined).cssVars['--badge-fill']).toBe(colors.navy)
    expect(resolveScheme('warsztat', 'default', undefined).cssVars['--badge-text']).toBe(colors.lime)
    expect(resolveScheme('warsztat', 'default', undefined).cssVars['--pill-fill']).toBe(colors.lime)
    expect(resolveScheme('warsztat', 'default', undefined).cssVars['--pill-text']).toBe(colors.limeText)
    expect(resolveScheme('rekrutacja', 'limonka', undefined).cssVars['--band']).toBe(colors.navy)
    expect(resolveScheme('rekrutacja', 'limonka', undefined).cssVars['--badge-color']).toBe(colors.lime)
  })

  it('brak wybranego akcentu → renderuje defaultAccent schematu', () => {
    expect(resolveScheme('wyklad', 'czern', undefined).cssVars['--badge-fill']).toBe(colors.lime)
    expect(resolveScheme('rekrutacja', 'czern', undefined).cssVars['--band']).toBe(colors.lime)
  })

  it('Konferencja: header-badge liczony względem panelu (ciemnego), nie strony', () => {
    // czern: panel = inkPanel (ciemny) → granatowy header-badge = navyLight
    expect(resolveScheme('konferencja', 'czern', 'granatowy').cssVars['--header-badge']).toBe(colors.navyLight)
    expect(resolveScheme('konferencja', 'czern', 'granatowy').cssVars['--footer-badge']).toBe(colors.navyLight)
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

  it('Konferencja/Warsztat default: header/pill śledzą akcent, line/badge stałe na jasnym tle', () => {
    const kon = resolveScheme('konferencja', 'default', 'pomaranczowy')
    expect(kon.cssVars['--header-badge']).toBe(colors.coral)
    expect(kon.cssVars['--line-first']).toBe(colors.navy)      // jasne tło → stałe, nie akcent
    expect(kon.cssVars['--footer-badge']).toBe(colors.navy)
    const wa = resolveScheme('warsztat', 'default', 'pomaranczowy')
    expect(wa.cssVars['--pill-fill']).toBe(colors.coral)
    expect(wa.cssVars['--badge-fill']).toBe(colors.navy)       // jasne tło → stałe, nie akcent
    expect(wa.cssVars['--badge-text']).toBe(colors.lime)
  })

  it('Rekrutacja limonka × akcent: badgeColor = tło strony (limonka)', () => {
    const rek = resolveScheme('rekrutacja', 'limonka', 'pomaranczowy')
    expect(rek.cssVars['--band']).toBe(colors.coral)
    expect(rek.cssVars['--badge-color']).toBe(colors.lime)
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
