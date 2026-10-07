import { useEffect, useRef } from 'react'
import { SHORTCUTS, isMacPlatform, matchesCombo, type ShortcutId } from './shortcuts'

type Handlers = Partial<Record<ShortcutId, (() => void) | undefined>>

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

// Jeden nasłuch `keydown` na oknie. Skróty z rejestru bez handlera są pomijane
// (przeglądarka działa normalnie); z handlerem - blokujemy domyślną akcję,
// żeby np. Ctrl+S nie otwierał okna zapisu strony.
export function useShortcuts(handlers: Handlers): void {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    const isMac = isMacPlatform()
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return
      for (const shortcut of SHORTCUTS) {
        const handler = ref.current[shortcut.id]
        if (!handler || !matchesCombo(event, shortcut.combo, isMac)) continue
        if (!shortcut.allowInInputs && isTypingTarget(event.target)) continue
        event.preventDefault()
        handler()
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
