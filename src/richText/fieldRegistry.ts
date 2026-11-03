// Rejestr pól z formatowaniem: pasek formatowania znajduje pole z fokusem
// (albo zaznaczeniem) i woła jego uchwyt.

import type { Align } from './format'

export type FormatOp = { kind: 'mark'; mark: number } | { kind: 'clear' } | { kind: 'align'; align: Align }

// Drugi argument onChange pola: zmiana z formatowania (pasek, skrót), nie z pisania.
// Historia slajdów robi z niej osobny krok cofania.
export interface ChangeMeta { kind: 'format' }

export interface ToolbarState { marks: number; align: Align | null; alignable: boolean }

export interface RichFieldHandle {
  applyFormat(op: FormatOp): void
  state(): ToolbarState
  // Fokus z powrotem w polu, z zapamiętanym zaznaczeniem (Escape w pasku).
  focus(): void
}

const fields = new WeakMap<Node, RichFieldHandle>()

/** Rejestruje pole; zwraca funkcję wyrejestrowania (usuwa tylko ten uchwyt). */
export function registerRichField(el: HTMLElement, handle: RichFieldHandle): () => void {
  fields.set(el, handle)
  return () => {
    if (fields.get(el) === handle) fields.delete(el)
  }
}

/** Najbliższe zarejestrowane pole w górę drzewa od węzła (włącznie). */
export function richFieldFor(node: Node | null): { el: HTMLElement; handle: RichFieldHandle } | null {
  for (let n = node; n; n = n.parentNode) {
    const handle = fields.get(n)
    if (handle) return { el: n as HTMLElement, handle }
  }
  return null
}

// Alt+F10 w polu: pasek pokazuje się dla tego pola i dostaje fokus.
let toolbarListener: ((el: HTMLElement) => void) | null = null

/** Nasłuch próśb o pasek (jeden - FormatToolbar); zwraca funkcję wyłączenia. */
export function listenToolbarRequests(listener: (el: HTMLElement) => void): () => void {
  toolbarListener = listener
  return () => {
    if (toolbarListener === listener) toolbarListener = null
  }
}

/** Prośba pola o pasek z fokusem; false, gdy paska nie ma. */
export function requestToolbar(el: HTMLElement): boolean {
  if (!toolbarListener) return false
  toolbarListener(el)
  return true
}
