import { describe, expect, it } from 'vitest'
import { h, render } from '../../components/ui/testUtils'
import { DEFAULT_RENDER_INFO, SlideRenderContext } from '../defineSlide'
import type { SlideAspect } from '../types'
import Liczba from './Liczba'
import Sekcja from './Sekcja'
import Tytul from './Tytul'

const aspects: SlideAspect[] = ['16:9', '1:1']

function html(def: typeof Tytul, aspect: SlideAspect, background = def.background ?? 'jasne'): string {
  return render(
    h(SlideRenderContext.Provider, { value: { ...DEFAULT_RENDER_INFO, aspect, background } }, h(def.Component, { data: def.defaults })),
  )
}

const expected: [typeof Tytul, string[]][] = [
  [Tytul, ['Poznajmy się', 'Studenckie Koło Naukowe Matematyków', 'Politechniki Krakowskiej', 'Matematyka w praktyce']],
  [Sekcja, ['01', 'Rozdział', 'Czym zajmuje się koło', 'Warsztaty, wydarzenia i projekty']],
  [Liczba, ['W liczbach', '15', 'edycji warsztatów WSAD', 'Od pierwszej edycji']],
]

describe.each(expected)('układ %#', (def, texts) => {
  it.each(aspects)('rysuje domyślne teksty (%s)', (aspect) => {
    const out = html(def, aspect)
    for (const t of texts) expect(out).toContain(t)
  })
  it('pola panelu istnieją w defaults, kroki to liczba', () => {
    for (const f of def.fields) expect(Object.keys(def.defaults)).toContain(f.key)
    expect(typeof (def.steps?.(def.defaults) ?? 0)).toBe('number')
  })
})

describe('Liczba', () => {
  it('ma tyle kroków, ile liczb', () => {
    const stats = [{ value: '1', label: 'a' }, { value: '2', label: 'b' }]
    expect(Liczba.steps?.({ ...Liczba.defaults, stats })).toBe(2)
  })
})
