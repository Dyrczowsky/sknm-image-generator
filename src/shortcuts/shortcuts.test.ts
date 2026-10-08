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
  it('kombinacja z alt wymaga Alt i niczego więcej', () => {
    const tab = { key: '2', alt: true, code: 'Digit2' }
    expect(matchesCombo(ev({ key: '2', code: 'Digit2', altKey: true }), tab, false)).toBe(true)
    expect(matchesCombo(ev({ key: '2', code: 'Digit2' }), tab, false)).toBe(false)
    // AltGr na Windowsie = Ctrl+Alt.
    expect(matchesCombo(ev({ key: '2', code: 'Digit2', altKey: true, ctrlKey: true }), tab, false)).toBe(false)
    expect(matchesCombo(ev({ key: '2', code: 'Digit2', altKey: true, shiftKey: true }), tab, false)).toBe(false)
  })
  it('przy alt liczy się fizyczny klawisz: na Macu ⌥2 wpisuje „™"', () => {
    const tab = { key: '2', alt: true, code: 'Digit2' }
    expect(matchesCombo(ev({ key: '™', code: 'Digit2', altKey: true }), tab, true)).toBe(true)
    expect(matchesCombo(ev({ key: '™', code: 'Digit3', altKey: true }), tab, true)).toBe(false)
    // Zdarzenie bez `code` (stare przeglądarki, testy) porównuje `key`.
    expect(matchesCombo(ev({ key: '2', altKey: true }), tab, false)).toBe(true)
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
  it('zakładka edytora (Alt)', () => {
    expect(formatCombo({ key: '1', alt: true, code: 'Digit1' }, true)).toBe('⌥1')
    expect(formatCombo({ key: '1', alt: true, code: 'Digit1' }, false)).toBe('Alt+1')
  })
})

describe('SHORTCUTS', () => {
  it('rejestr ma zapis, eksport, trzy zakładki edytora i pomoc; pomoc nie działa w polach', () => {
    expect(SHORTCUTS.map((s) => s.id)).toEqual(['save', 'export', 'tabTemplate', 'tabContent', 'tabLook', 'help'])
    expect(SHORTCUTS.find((s) => s.id === 'help')?.allowInInputs).toBe(false)
    expect(SHORTCUTS.find((s) => s.id === 'save')?.allowInInputs).toBe(true)
  })
  it('zakładki edytora to Alt+1/2/3 w kolejności zakładek', () => {
    const tabs = SHORTCUTS.filter((s) => s.id.startsWith('tab'))
    expect(tabs.map((s) => formatCombo(s.combo, false))).toEqual(['Alt+1', 'Alt+2', 'Alt+3'])
    expect(tabs.map((s) => s.combo.code)).toEqual(['Digit1', 'Digit2', 'Digit3'])
  })
})
