import { describe, expect, it } from 'vitest'
import { h, render } from '../../components/ui/testUtils'
import { DEFAULT_RENDER_INFO, SlideRenderContext } from '../defineSlide'
import type { SlideRenderInfo } from '../defineSlide'
import { EMPTY_PHOTO } from '../types'
import { Kicker, PhotoFigure, SlideFrame, SlideNumber, Step, TriangleBand } from './_wspolne'

function inSlide(info: Partial<SlideRenderInfo>, element: unknown): string {
  return render(h(SlideRenderContext.Provider, { value: { ...DEFAULT_RENDER_INFO, ...info } }, element))
}

describe('SlideFrame', () => {
  it('ma rozmiar układu dla obu proporcji', () => {
    expect(inSlide({ aspect: '16:9' }, h(SlideFrame, null, 'x'))).toContain('width:1600px;height:900px')
    expect(inSlide({ aspect: '1:1' }, h(SlideFrame, null, 'x'))).toContain('width:1200px;height:1200px')
  })
})

describe('SlideNumber', () => {
  it('pokazuje numer i liczbę slajdów z zerem wiodącym', () => {
    expect(inSlide({ index: 2, total: 10 }, h(SlideNumber, null))).toContain('03 / 10')
  })

  it('w kwadracie kotwiczy po prawej', () => {
    expect(inSlide({ aspect: '1:1' }, h(SlideNumber, null))).toContain('right:80px')
    expect(inSlide({ aspect: '16:9' }, h(SlideNumber, null))).toContain('left:100px')
  })
})

describe('TriangleBand', () => {
  it('jest deterministyczny dla numeru slajdu', () => {
    const a = inSlide({ index: 3 }, h(TriangleBand, null))
    expect(inSlide({ index: 3 }, h(TriangleBand, null))).toBe(a)
    expect(inSlide({ index: 4 }, h(TriangleBand, null))).not.toBe(a)
    expect(a).toContain('<polygon')
  })
})

describe('Step', () => {
  const step = (info: Partial<SlideRenderInfo>) => inSlide(info, h(Step, { index: 2 }, 'x'))

  it('ukrywa element, gdy krok jest mniejszy i włączone „po kolei"', () => {
    const html = step({ reveal: true, step: 1 })
    expect(html).toContain('opacity:0')
    expect(html).toContain('translateY(24px)')
  })

  it('pokazuje element od właściwego kroku', () => {
    expect(step({ reveal: true, step: 2 })).toContain('opacity:1')
  })

  it('bez „po kolei" jest zawsze widoczny', () => {
    expect(step({ reveal: false, step: 0 })).toContain('opacity:1')
  })
})

describe('PhotoFigure', () => {
  it('bez pliku rysuje zakreskowane miejsce na zdjęcie', () => {
    const html = inSlide({}, h(PhotoFigure, { photo: EMPTY_PHOTO }))
    expect(html).toContain('ZDJĘCIE')
    expect(html).toContain('repeating-linear-gradient')
    expect(html).not.toContain('<img')
  })

  it('ze zdjęciem ustawia kadr', () => {
    const html = inSlide({}, h(PhotoFigure, { photo: { src: 'a.png', x: 30, y: 70, zoom: 1.5 } }))
    expect(html).toContain('<img')
    expect(html).toContain('object-position:30% 70%')
    expect(html).toContain('scale(1.5)')
  })
})

describe('Kicker', () => {
  it('pusty poza edytorem nic nie rysuje', () => {
    expect(inSlide({}, h(Kicker, { path: 'kicker', value: '' }))).toBe('')
  })

  it('z tekstem rysuje trójkąt i napis', () => {
    const html = inSlide({}, h(Kicker, { path: 'kicker', value: 'Spotkanie' }))
    expect(html).toContain('Spotkanie')
    expect(html).toContain('clip-path')
  })
})
