import { describe, expect, it } from 'vitest'
import { SHORTCUTS, formatCombo, matchesCombo } from './shortcuts'

const ev = (over: Partial<Parameters<typeof matchesCombo>[0]> = {}) => ({
  key: 's', metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...over,
})
const save = { key: 's', mod: true }

describe('matchesCombo', () => {
  it('na Macu mod to metaKey, nie ctrlKey', () => {
    expect(matchesCombo(ev({ metaKey: true }), save, true)).toBe(true)
    expect(matchesCombo(ev({ ctrlKey: true }), save, true)).toBe(false)
  })
  it('poza Makiem mod to ctrlKey, nie metaKey', () => {
    expect(matchesCombo(ev({ ctrlKey: true }), save, false)).toBe(true)
    expect(matchesCombo(ev({ metaKey: true }), save, false)).toBe(false)
  })
  it('samo „s" nie pasuje do zapisu', () => {
    expect(matchesCombo(ev(), save, false)).toBe(false)
  })
  it('wielkość liter klawisza nie ma znaczenia', () => {
    expect(matchesCombo(ev({ key: 'S', ctrlKey: true }), save, false)).toBe(true)
  })
  it('powtórzone zdarzenie (przytrzymany klawisz) jest ignorowane', () => {
    expect(matchesCombo(ev({ ctrlKey: true, repeat: true }), save, false)).toBe(false)
  })
  it('kombinacja bez mod nie pasuje przy wciśniętym meta/ctrl/alt', () => {
    const help = { key: '?' }
    expect(matchesCombo(ev({ key: '?', shiftKey: true }), help, false)).toBe(true)
    expect(matchesCombo(ev({ key: '?' }), help, false)).toBe(true)
    for (const mod of ['metaKey', 'ctrlKey', 'altKey'] as const) {
      expect(matchesCombo(ev({ key: '?', [mod]: true }), help, false), mod).toBe(false)
    }
  })
  it('shift w kombinacji jest wymagany, a bez niego zabroniony', () => {
    expect(matchesCombo(ev({ ctrlKey: true }), { key: 's', mod: true, shift: true }, false)).toBe(false)
    expect(matchesCombo(ev({ ctrlKey: true, shiftKey: true }), save, false)).toBe(false)
    expect(matchesCombo(ev({ ctrlKey: true, shiftKey: true }), { key: 's', mod: true, shift: true }, false)).toBe(true)
  })
  it('alt blokuje kombinację z mod', () => {
    expect(matchesCombo(ev({ ctrlKey: true, altKey: true }), save, false)).toBe(false)
  })
})

describe('formatCombo', () => {
  it('zapis', () => {
    expect(formatCombo(save, true)).toBe('⌘S')
    expect(formatCombo(save, false)).toBe('Ctrl+S')
  })
  it('eksport (Enter)', () => {
    expect(formatCombo({ key: 'Enter', mod: true }, true)).toBe('⌘↵')
    expect(formatCombo({ key: 'Enter', mod: true }, false)).toBe('Ctrl+Enter')
  })
  it('pomoc', () => {
    expect(formatCombo({ key: '?' }, true)).toBe('?')
    expect(formatCombo({ key: '?' }, false)).toBe('?')
  })
})

describe('SHORTCUTS', () => {
  it('rejestr ma zapis, eksport i pomoc; pomoc nie działa w polach', () => {
    expect(SHORTCUTS.map((s) => s.id)).toEqual(['save', 'export', 'help'])
    expect(SHORTCUTS.find((s) => s.id === 'help')?.allowInInputs).toBe(false)
    expect(SHORTCUTS.find((s) => s.id === 'save')?.allowInInputs).toBe(true)
  })
})
