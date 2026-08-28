// Ręczny smoke-test resolvera schematów (brak test runnera w projekcie).
// Uruchom: node scripts/check-schemes.mjs
import assert from 'node:assert/strict'
import { resolveScheme, schemes, SCHEME_LABELS } from '../src/posters/schemes.js'

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

console.log('check-schemes: OK')
