// Rejestr pól z formatowaniem: pasek formatowania znajduje pole z fokusem
// (albo zaznaczeniem) i woła jego uchwyt.

import type { Align } from './format'

export type FormatOp = { kind: 'mark'; mark: number } | { kind: 'clear' } | { kind: 'align'; align: Align }

export interface ToolbarState { marks: number; align: Align | null; alignable: boolean }

export interface RichFieldHandle {
  applyFormat(op: FormatOp): void
  state(): ToolbarState
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
