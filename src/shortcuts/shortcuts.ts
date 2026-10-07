// Jedyny rejestr skrótów klawiszowych: z niego korzysta i obsługa klawiszy
// (useShortcuts), i okienko pomocy (ShortcutsHelp).
export type ShortcutId = 'save' | 'export' | 'help'

// `mod` = ⌘ na Macu, Ctrl gdzie indziej.
export interface Combo {
  key: string
  mod?: boolean
  shift?: boolean
}

export interface Shortcut {
  id: ShortcutId
  combo: Combo
  label: string
  allowInInputs: boolean
}

export const SHORTCUTS: readonly Shortcut[] = [
  { id: 'save', combo: { key: 's', mod: true }, label: 'Zapisz projekt', allowInInputs: true },
  { id: 'export', combo: { key: 'Enter', mod: true }, label: 'Pobierz plakat', allowInInputs: true },
  { id: 'help', combo: { key: '?' }, label: 'Pokaż skróty klawiszowe', allowInInputs: false },
]

export interface KeyEventLike {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  repeat?: boolean
}

export function matchesCombo(event: KeyEventLike, combo: Combo, isMac: boolean): boolean {
  if (event.repeat) return false
  if (event.key.toLowerCase() !== combo.key.toLowerCase()) return false
  const modHeld = isMac ? event.metaKey : event.ctrlKey
  const otherModHeld = isMac ? event.ctrlKey : event.metaKey
  if (Boolean(combo.mod) !== modHeld || otherModHeld || event.altKey) return false
  // „?" wymaga Shiftu na części układów, na innych nie - nie sprawdzamy go.
  if (combo.key !== '?' && Boolean(combo.shift) !== event.shiftKey) return false
  return true
}

export function formatCombo(combo: Combo, isMac: boolean): string {
  const key = combo.key.length === 1 ? combo.key.toUpperCase() : combo.key
  const shown = isMac && key === 'Enter' ? '↵' : key
  const parts = [...(combo.mod ? [isMac ? '⌘' : 'Ctrl'] : []), ...(combo.shift ? [isMac ? '⇧' : 'Shift'] : []), shown]
  return isMac ? parts.join('') : parts.join('+')
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
}
