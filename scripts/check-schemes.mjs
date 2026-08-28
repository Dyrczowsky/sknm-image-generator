// Ręczny smoke-test resolvera schematów (brak test runnera w projekcie).
// Uruchom: node scripts/check-schemes.mjs
import assert from 'node:assert/strict'
import { resolveScheme, schemes, SCHEME_LABELS } from '../src/posters/schemes.js'
import { colors } from '../src/posters/theme.js'

// Task 1: pusty rejestr — resolver nie wybucha.
{
  const s = resolveScheme('nieistnieje', 'tez-nie')
  assert.deepEqual(s.cssVars, {})
  assert.equal(s.sygnet, undefined)
  assert.equal(s.logoVariant, undefined)
}

// roleToVar przez publiczne API: dołóż tymczasowy layout i sprawdź nazwy varów.
{
  schemes.__probe = { default: { pageBg: '#000', badgeFill: '#111', wedgeBr: '#222', tri1: '#333', logoVariant: 'dark' } }
  const s = resolveScheme('__probe', undefined)
  assert.equal(s.cssVars['--page-bg'], '#000')
  assert.equal(s.cssVars['--badge-fill'], '#111')
  assert.equal(s.cssVars['--wedge-br'], '#222')
  assert.equal(s.cssVars['--tri1'], '#333')
  assert.equal(s.cssVars['--logo-variant'], undefined) // NON_CSS
  assert.equal(s.logoVariant, 'dark')
  delete schemes.__probe
}

assert.equal(SCHEME_LABELS.czern, 'Czerń')

// Ogłoszenie
{
  const d = resolveScheme('ogloszenie', undefined)
  assert.equal(d.cssVars['--page-bg'], colors.navy)
  assert.equal(d.cssVars['--accent'], colors.lime)
  assert.equal(d.sygnet, 'negatywny')
  const cz = resolveScheme('ogloszenie', 'czern')
  assert.equal(cz.cssVars['--page-bg'], colors.black)
  assert.equal(cz.cssVars['--accent'], colors.gold)
  assert.equal(cz.cssVars['--page-text'], colors.cream) // z default
  assert.equal(cz.logoVariant, 'dark')                  // z default
  const zl = resolveScheme('ogloszenie', 'zloto')
  assert.equal(zl.cssVars['--page-bg'], colors.navy)    // z default
  assert.equal(zl.sygnet, 'zloty')
}

// Gala (jeden schemat)
{
  const d = resolveScheme('gala', undefined)
  assert.equal(d.cssVars['--page-bg'], colors.ink)
  assert.equal(d.cssVars['--gold'], colors.gold)
  assert.equal(d.cssVars['--panel-br'], colors.inkPanel)
  assert.equal(d.sygnet, 'zloty')
}

// Gość
{
  const d = resolveScheme('gosc', undefined)
  assert.equal(d.cssVars['--accent'], colors.navy)
  assert.equal(d.sygnet, 'negatywny')
  const cz = resolveScheme('gosc', 'czern')
  assert.equal(cz.cssVars['--accent'], colors.gold)
  assert.equal(cz.sygnet, 'negatywny')   // Gość: czerń zostaje przy negatywnym
  assert.equal(cz.cssVars['--muted-text'], colors.creamMuted)
  const ja = resolveScheme('gosc', 'jasny')
  assert.equal(ja.cssVars['--page-bg'], colors.paper)
  assert.equal(ja.cssVars['--accent'], colors.navy)         // z default
  assert.equal(ja.cssVars['--muted-text'], colors.textMuted) // z default
  const sz = resolveScheme('gosc', 'szary')
  assert.equal(sz.cssVars['--page-text'], colors.slate)
  assert.equal(sz.cssVars['--muted-text'], colors.textMuted) // szary NIE nadpisuje
}

// Data
{
  const d = resolveScheme('data', undefined)
  assert.equal(d.cssVars['--page-text'], colors.navy)   // Data default: tekst granatowy
  assert.equal(d.cssVars['--tri2'], colors.lime)
  const sz = resolveScheme('data', 'szary')
  assert.equal(sz.cssVars['--tri3'], colors.coral)      // szary nie nadpisuje tri3
  assert.equal(sz.cssVars['--tri1'], colors.grayDark)
  const ja = resolveScheme('data', 'jasny')
  assert.equal(ja.cssVars['--title'], colors.ink)       // z default
}

// Wykład
{
  const d = resolveScheme('wyklad', undefined)
  assert.equal(d.cssVars['--badge-fill'], colors.lime)
  assert.equal(d.cssVars['--badge-text'], colors.limeText)
  assert.equal(d.cssVars['--wedge-bl'], colors.navyDark)
  const zl = resolveScheme('wyklad', 'zloto')
  assert.equal(zl.cssVars['--page-bg'], colors.navy)          // z default (zloto = navy)
  assert.equal(zl.cssVars['--wedge-br'], colors.navyLight)    // z default
  assert.equal(zl.cssVars['--speaker'], colors.cream)
  const cz = resolveScheme('wyklad', 'czern')
  assert.equal(cz.cssVars['--wedge-bl'], '#0A0A0A')
  assert.equal(cz.sygnet, 'negatywny')                        // Wykład czerń: negatyw, nie złoto
}

// Konferencja
{
  const d = resolveScheme('konferencja', undefined)
  assert.equal(d.cssVars['--panel'], colors.navy)
  assert.equal(d.cssVars['--line-rest'], colors.creamMuted)
  const cz = resolveScheme('konferencja', 'czern')
  assert.equal(cz.cssVars['--panel'], colors.inkPanel)
  assert.equal(cz.cssVars['--line-rest'], 'rgba(244,242,237,.2)')
  assert.equal(cz.cssVars['--panel-text'], colors.cream)   // z default
  const ja = resolveScheme('konferencja', 'jasny')
  assert.equal(ja.cssVars['--panel'], colors.navy)         // z default
  const sz = resolveScheme('konferencja', 'szary')
  assert.equal(sz.cssVars['--line-rest'], colors.creamMuted) // szary nie nadpisuje
}

// Rekrutacja (default = limonka)
{
  const li = resolveScheme('rekrutacja', 'limonka')
  assert.equal(li.cssVars['--page-bg'], colors.lime)
  assert.equal(li.cssVars['--band'], colors.navy)
  const zl = resolveScheme('rekrutacja', 'zloto')
  assert.equal(zl.cssVars['--page-bg'], colors.gold)
  assert.equal(zl.cssVars['--footer-text'], colors.cream)   // z limonka
  assert.equal(zl.cssVars['--qr-border'], 'rgba(244,242,237,.55)') // z limonka
  assert.equal(zl.logoVariant, 'dark')                      // z limonka
  const cz = resolveScheme('rekrutacja', 'czern')
  assert.equal(cz.cssVars['--qr-border'], 'rgba(18,18,18,.4)')
  assert.equal(cz.logoVariant, 'light')
}

console.log('check-schemes: OK')
