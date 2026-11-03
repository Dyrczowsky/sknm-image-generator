import { describe, expect, it } from 'vitest'
import { h, render } from '../../components/ui/testUtils'
import { DEFAULT_RENDER_INFO, SlideRenderContext } from '../defineSlide'
import type { SlideAspect } from '../types'
import TekstZdjecia from './TekstZdjecia'
import Zdjecie from './Zdjecie'

const layouts = [TekstZdjecia, Zdjecie]
const aspects: SlideAspect[] = ['16:9', '1:1']

describe('układy zdjęciowe', () => {
  for (const def of layouts) {
    describe(def.key, () => {
      for (const aspect of aspects) {
        for (const mirrored of [false, true]) {
          it(`rysuje domyślne teksty (${aspect}, lustro ${mirrored})`, () => {
            const html = render(
              h(SlideRenderContext.Provider, { value: { ...DEFAULT_RENDER_INFO, aspect, mirrored } }, h(def.Component, { data: def.defaults })),
            )
            for (const v of Object.values(def.defaults)) {
              if (typeof v === 'string' && v) expect(html).toContain(v)
            }
          })
        }
      }
      it('pola istnieją w defaults, steps zwraca liczbę', () => {
        for (const f of def.fields) expect(def.defaults).toHaveProperty(f.key)
        if (def.steps) expect(typeof def.steps(def.defaults)).toBe('number')
      })
    })
  }

  it('tekstZdjecia: kroki zależą od drugiego zdjęcia', () => {
    expect(TekstZdjecia.steps?.({ ...TekstZdjecia.defaults, showPhoto2: false })).toBe(1)
    expect(TekstZdjecia.steps?.(TekstZdjecia.defaults)).toBe(2)
  })
})
