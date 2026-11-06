import { describe, expect, it } from 'vitest'
import { h, render } from '../../components/ui/testUtils'
import { PosterAutoFit } from './PosterAutoFit'
import { posterFit, posterFitMin, wholeLinesHeight } from './posterFit'

describe('PosterAutoFit', () => {
  it('posterFit mnoży rozmiar przez --fit', () => {
    expect(posterFit(30)).toBe('calc(30px * var(--fit, 1))')
  })

  it('posterFitMin: próg w px niezależny od suwaka', () => {
    expect(posterFitMin(22, 28)).toBeCloseTo(22 / 28)
    // Suwak ×1,3: font 36,4 px nadal schodzi do 22 px, nie do 0,78 × 36,4.
    expect(posterFitMin(22, 28 * 1.3) * 28 * 1.3).toBeCloseTo(22)
    // Font już mniejszy od progu - bez zmniejszania.
    expect(posterFitMin(22, 20)).toBe(1)
    expect(posterFitMin(22, 0)).toBe(1)
  })

  it('wholeLinesHeight: ucina na granicy wiersza', () => {
    // 327 px pudełka, wiersze po 31,9 px: 10 pełnych wierszy = 319 px.
    expect(wholeLinesHeight(327, 0, 31.9)).toBeCloseTo(319)
    // Tekst zaczyna się 10 px niżej.
    expect(wholeLinesHeight(327, 10, 31.9)).toBeCloseTo(10 + 9 * 31.9)
    // Pełne wiersze (z zaokrągleniem przeglądarki) - bez zmian.
    expect(wholeLinesHeight(162.4, 0, 40.6)).toBeCloseTo(162.4)
    expect(wholeLinesHeight(162, 0, 40.6)).toBe(162)
    // Mniej niż jeden wiersz albo brak interlinii - bez zmian.
    expect(wholeLinesHeight(30, 0, 40)).toBe(30)
    expect(wholeLinesHeight(300, 0, NaN)).toBe(300)
  })

  it('rysuje dzieci w pudełku z --fit i ukrytym overflow', () => {
    const html = render(h(PosterAutoFit, { notice: 'x' }, h('p', { style: { fontSize: posterFit(30) } }, 'Opis')))
    expect(html).toContain('--fit:1')
    expect(html).toContain('overflow:hidden')
    expect(html).toContain('Opis')
  })
})
