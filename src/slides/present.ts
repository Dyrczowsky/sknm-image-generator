// Nawigacja pokazu slajdów (jak w PowerPoint). Pozycja to slajd + liczba
// kroków „pokazuj po kolei" już widocznych na tym slajdzie. Moduł jest czysty:
// bez stanu i bez DOM, łatwy do testowania.

import type { Deck } from './types'
import { layoutOf } from './komponenty'

export interface PresentPos {
  slide: number
  step: number
}

const START: PresentPos = { slide: 0, step: 0 }

// Liczba kroków każdego slajdu. Slajd bez `reveal` ma 0 kroków.
export function stepsForDeck(deck: Pick<Deck, 'slides'>): number[] {
  return deck.slides.map((slide) => {
    if (!slide.reveal) return 0
    const layout = layoutOf(slide.layout)
    if (!layout) return 0
    return layout.steps?.({ ...layout.defaults, ...slide.data }) ?? 0
  })
}

// Krok do przodu: najpierw kolejne elementy slajdu, potem pierwszy krok następnego.
// Na końcu pokazu pozycja się nie zmienia.
export function next(pos: PresentPos, steps: number[]): PresentPos {
  if (steps.length === 0) return { ...START }
  const last = steps.length - 1
  if (pos.step < steps[pos.slide]) return { slide: pos.slide, step: pos.step + 1 }
  if (pos.slide < last) return { slide: pos.slide + 1, step: 0 }
  return { ...pos }
}

// Krok wstecz: najpierw ukryj ostatni element, potem wróć do poprzedniego slajdu
// w pełni odsłoniętego. Na początku pokazu pozycja się nie zmienia.
export function prev(pos: PresentPos, steps: number[]): PresentPos {
  if (steps.length === 0) return { ...START }
  if (pos.step > 0) return { slide: pos.slide, step: pos.step - 1 }
  if (pos.slide > 0) return { slide: pos.slide - 1, step: steps[pos.slide - 1] }
  return { ...pos }
}

export function first(): PresentPos {
  return { ...START }
}

// Ostatni slajd w pełni odsłonięty.
export function last(steps: number[]): PresentPos {
  if (steps.length === 0) return { ...START }
  const slide = steps.length - 1
  return { slide, step: steps[slide] }
}

// Skok do slajdu (ucina do zakresu), zawsze na krok 0.
export function goto(index: number, steps: number[]): PresentPos {
  if (steps.length === 0) return { ...START }
  const n = Math.trunc(index) || 0
  const slide = Math.min(Math.max(n, 0), steps.length - 1)
  return { slide, step: 0 }
}

export function isAtEnd(pos: PresentPos, steps: number[]): boolean {
  if (steps.length === 0) return true
  const last = steps.length - 1
  return pos.slide === last && pos.step >= steps[last]
}

export function isAtStart(pos: PresentPos): boolean {
  return pos.slide === 0 && pos.step === 0
}

// Kierunek zmiany slajdu: 1 do przodu, -1 wstecz, 0 gdy slajd ten sam.
export function direction(from: PresentPos, to: PresentPos): 1 | -1 | 0 {
  if (to.slide > from.slide) return 1
  if (to.slide < from.slide) return -1
  return 0
}
