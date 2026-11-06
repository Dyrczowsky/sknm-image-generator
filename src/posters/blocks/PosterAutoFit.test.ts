import { describe, expect, it } from 'vitest'
import { h, render } from '../../components/ui/testUtils'
import { PosterAutoFit, posterFit } from './PosterAutoFit'

describe('PosterAutoFit', () => {
  it('posterFit mnoży rozmiar przez --fit', () => {
    expect(posterFit(30)).toBe('calc(30px * var(--fit, 1))')
  })

  it('rysuje dzieci w pudełku z --fit i ukrytym overflow', () => {
    const html = render(h(PosterAutoFit, { notice: 'x' }, h('p', { style: { fontSize: posterFit(30) } }, 'Opis')))
    expect(html).toContain('--fit:1')
    expect(html).toContain('overflow:hidden')
    expect(html).toContain('Opis')
  })
})
