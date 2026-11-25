import { useSyncExternalStore } from 'react'

// Czy bloki plakatu naukowego wychodzą poza 3 kolumny. Plakat (podgląd w
// edytorze) zgłasza wynik pomiaru, formularz pokazuje ostrzeżenie.
// shortcut: jeden globalny stan - przy kilku podglądach naraz wygrywa ostatni pomiar.
let overflow = false
const listeners = new Set<() => void>()

export function reportOverflow(value: boolean): void {
  if (value === overflow) return
  overflow = value
  listeners.forEach((listener) => listener())
}

export function useBlocksOverflow(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => overflow,
  )
}
