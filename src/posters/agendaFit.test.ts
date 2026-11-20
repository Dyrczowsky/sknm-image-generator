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
  it('jeden krok zmniejsza tekst najwyżej o 0,05 (zawijany program maleje nieliniowo)', () => {
    const fit = initialAgendaFit(LIMITS.maxPad)
    const next = nextAgendaFit(fit, measure(fit, 10, 100), LIMITS)
    expect(next.scale).toBeCloseTo(0.95)
  })

  it('start od dwóch kolumn: zostają dwie, bez przechodzenia przez jedną', () => {
    const fit = initialAgendaFit(12, 2)
    expect(fit.columns).toBe(2)
    expect(nextAgendaFit(fit, measure(fit, 10, 400), { ...LIMITS, maxPad: 12 }).columns).toBe(2)
  })
  it('nowrapFloor: zawinięty opis zmniejsza tekst (krokiem 0,05) tylko do progu', () => {
    const limits = { ...LIMITS, maxPad: 12, nowrapFloor: 0.5 }
    const fit = initialAgendaFit(12)
    const wrapped = { ...measure(fit, 3, 1000), wrapped: true }
    expect(nextAgendaFit(fit, wrapped, limits).scale).toBeCloseTo(0.95)
    const atFloor = { ...fit, scale: 0.5 }
    expect(nextAgendaFit(atFloor, { ...measure(atFloor, 3, 1000), wrapped: true }, limits).scale).toBe(0.5)
    // Bez progu (plakat) zawijanie nic nie zmienia.
    expect(nextAgendaFit(fit, wrapped, { ...LIMITS, maxPad: 12 }).scale).toBe(1)
  })
})
