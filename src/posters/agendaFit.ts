// Dopasowanie programu Konferencji do miejsca między nagłówkiem a stopką.
// Plakat do druku ma stały format (A2/A3/A4), więc długi program nie może
// wydłużyć kadru - zamiast tego, po kolei:
//
//   1. krótki program: wiersze dostają oddech (`pad`) aż do `maxPad`,
//   2. dłuższy: oddech maleje do `minPad`,
//   3. jeszcze dłuższy: tekst programu maleje do `minScale`,
//   4. dalej: program w dwóch kolumnach (znowu od pełnego rozmiaru tekstu),
//   5. i tam tekst do `minScale`,
//   6. gdy nadal się nie mieści: `overflow` = ile punktów wypada (ostrzeżenie
//      w edytorze - nic nie znika po cichu).
//
// Funkcja jest jednym krokiem: dostaje pomiar programu narysowanego z `fit`
// i zwraca ustawienia na następny render (ten sam obiekt = stan stabilny).
// Komponent woła ją po każdym renderze, aż wynik przestanie się zmieniać.

export interface AgendaFit {
  // Pionowy padding wiersza programu (px, z góry i z dołu).
  pad: number
  // Mnożnik rozmiaru tekstu programu.
  scale: number
  columns: 1 | 2
  // Ile punktów nie mieści się nawet w najciaśniejszym układzie.
  overflow: number
}

export interface AgendaLimits {
  maxPad: number
  minPad: number
  minScale: number
}

export interface AgendaMeasure {
  // Wysokość miejsca na program (px układu).
  avail: number
  // Wysokość programu narysowanego z bieżącym `fit` (najwyższa kolumna).
  listHeight: number
  items: number
  // Ile punktów mieści się w `avail` w bieżącym układzie.
  fitting: number
}

export const AGENDA_LIMITS: Omit<AgendaLimits, 'maxPad'> = { minPad: 8, minScale: 0.7 }

export const initialAgendaFit = (maxPad: number): AgendaFit => ({ pad: maxPad, scale: 1, columns: 1, overflow: 0 })

// Wierszy w najwyższej kolumnie.
export const agendaRows = (items: number, columns: 1 | 2): number => Math.ceil(items / columns)

const same = (a: AgendaFit, b: AgendaFit) => a.pad === b.pad && a.scale === b.scale && a.columns === b.columns && a.overflow === b.overflow

export function nextAgendaFit(fit: AgendaFit, m: AgendaMeasure, limits: AgendaLimits): AgendaFit {
  if (!(m.avail > 0) || !(m.listHeight > 0) || m.items === 0) return fit
  const rows = agendaRows(m.items, fit.columns)
  // Wysokość samej treści (bez paddingu wierszy) - nie zależy od `pad`.
  const content = m.listHeight - rows * 2 * fit.pad
  const tightest = content + rows * 2 * limits.minPad

  let next: AgendaFit
  if (tightest <= m.avail) {
    // Mieści się: rozdaj wolne miejsce na oddech wierszy (w granicach).
    const pad = Math.min(limits.maxPad, Math.max(limits.minPad, Math.floor((m.avail - content) / (2 * rows))))
    next = { ...fit, pad, overflow: 0 }
  } else if (fit.scale > limits.minScale) {
    // Treść skaluje się mniej więcej liniowo z tekstem; zaokrąglenie w dół
    // i krok co najmniej 0.02, żeby pętla zawsze schodziła.
    const target = (m.avail - rows * 2 * limits.minPad) / content
    const guess = Math.floor(fit.scale * target * 100) / 100
    const scale = Math.max(limits.minScale, Math.min(guess, Math.round((fit.scale - 0.02) * 100) / 100))
    next = { ...fit, pad: limits.minPad, scale, overflow: 0 }
  } else if (fit.columns === 1 && m.items > 1) {
    next = { pad: limits.minPad, scale: 1, columns: 2, overflow: 0 }
  } else {
    next = { ...fit, pad: limits.minPad, overflow: Math.max(0, m.items - m.fitting) }
  }
  return same(next, fit) ? fit : next
}
