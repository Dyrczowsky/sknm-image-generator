import { createElement } from 'react'
import type { CSSProperties, ReactNode } from 'react'

// SZKIC KONTRAKTU - pełną implementację (edycja na slajdzie, pomiar AutoFit)
// dopisuje zadanie 8b. Sygnatury eksportów nie mogą się zmienić.

// Rozmiar fontu, który zmniejsza AutoFit: `fontSize: fit(74)`.
export function fit(px: number): string {
  return `calc(${px}px * var(--fit, 1))`
}

export type EditableTag = 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'b' | 'i' | 'figcaption'

export interface EditableTextProps {
  // Ścieżka w `data` slajdu, np. `heading` albo `cards.2.title`.
  path: string
  value: string
  as?: EditableTag
  style?: CSSProperties
  // Enter = nowa linia (akapity). Bez tego Enter kończy edycję.
  multiline?: boolean
  // Podpowiedź w edytorze, gdy pole jest puste (poza edytorem pusty tekst nie rysuje nic).
  placeholder?: string
}

// Tekst slajdu, który w edytorze można kliknąć i zmienić.
export function EditableText({ value, as = 'div', style }: EditableTextProps) {
  return createElement(as, { style: { whiteSpace: 'pre-line', ...style } }, value)
}

export interface AutoFitProps {
  // Unikalny w obrębie slajdu - pod nim AutoFit zgłasza przepełnienie.
  id: string
  children: ReactNode
  // Pudełko, w którym tekst ma się zmieścić (musi mieć ograniczoną wysokość,
  // np. `flex: 1, minHeight: 0` albo stałe `height`).
  style?: CSSProperties
  // Najmniejszy mnożnik fontu (domyślnie 0,7).
  min?: number
}

// Zmniejsza fonty potomków (te podane przez `fit(px)`), aż treść zmieści się w pudełku.
export function AutoFit({ children, style }: AutoFitProps) {
  return <div style={{ minHeight: 0, ...style, ['--fit' as string]: 1 }}>{children}</div>
}
