import { describe, expect, it } from 'vitest'
import { AGENDA_LIMITS, agendaRows, initialAgendaFit, nextAgendaFit } from './agendaFit'
import type { AgendaFit } from './agendaFit'

const LIMITS = { ...AGENDA_LIMITS, maxPad: 62 }
// Model programu: każdy punkt ma `rowContent` px treści przy skali 1
// (skaluje się liniowo), plus padding wiersza.
const measure = (fit: AgendaFit, items: number, avail: number, rowContent = 70) => {
  const rows = agendaRows(items, fit.columns)
  const row = rowContent * fit.scale + 2 * fit.pad
  return { avail, listHeight: rows * row, items, fitting: Math.min(items, fit.columns * Math.floor(avail / row)) }
}
// Woła krok, aż wynik się ustabilizuje (jak komponent po kolejnych renderach).
const settle = (items: number, avail: number, rowContent?: number) => {
  let fit = initialAgendaFit(LIMITS.maxPad)
  for (let i = 0; i < 200; i++) {
    const next = nextAgendaFit(fit, measure(fit, items, avail, rowContent), LIMITS)
    if (next === fit) return fit
    fit = next
  }
  throw new Error('nie zbiega')
}

describe('nextAgendaFit', () => {
  it('krótki program: pełny tekst, oddech do maxPad', () => {
    expect(settle(3, 900)).toEqual({ pad: 62, scale: 1, columns: 1, overflow: 0 })
  })

  it('dłuższy: oddech maleje, tekst pełny', () => {
    const fit = settle(8, 900)
    expect(fit.scale).toBe(1)
    expect(fit.columns).toBe(1)
    expect(fit.pad).toBeGreaterThanOrEqual(LIMITS.minPad)
    expect(fit.pad).toBeLessThan(LIMITS.maxPad)
    expect(8 * (70 + 2 * fit.pad)).toBeLessThanOrEqual(900)
  })

  it('10 punktów na A3: jedna kolumna, mniejszy tekst - ale nie poniżej minimum', () => {
    const fit = settle(12, 900)
    expect(fit.columns).toBe(1)
    expect(fit.scale).toBeLessThan(1)
    expect(fit.scale).toBeGreaterThanOrEqual(LIMITS.minScale)
    expect(fit.overflow).toBe(0)
    expect(12 * (70 * fit.scale + 2 * fit.pad)).toBeLessThanOrEqual(900)
  })

  it('bardzo długi: dwie kolumny', () => {
    const fit = settle(20, 900)
    expect(fit.columns).toBe(2)
    expect(fit.overflow).toBe(0)
  })

  it('nie mieści się nawet w dwóch kolumnach: liczy, ile punktów wypada', () => {
    const fit = settle(60, 900)
    expect(fit.columns).toBe(2)
    expect(fit.scale).toBe(LIMITS.minScale)
    expect(fit.overflow).toBeGreaterThan(0)
  })

  it('bez pomiaru nic nie zmienia', () => {
    const fit = initialAgendaFit(62)
    expect(nextAgendaFit(fit, { avail: 0, listHeight: 0, items: 3, fitting: 0 }, LIMITS)).toBe(fit)
  })
})
