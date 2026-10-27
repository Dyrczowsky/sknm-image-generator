import { describe, expect, it } from 'vitest'
import { h, render } from '../../components/ui/testUtils'
import { DEFAULT_RENDER_INFO, SlideRenderContext } from '../defineSlide'
import type { SlideRenderInfo } from '../defineSlide'
import type { SlideAspect } from '../types'
import Karty from './Karty'
import Lista from './Lista'

const aspects: SlideAspect[] = ['16:9', '1:1']

function html(def: typeof Lista, data: object, info: Partial<SlideRenderInfo> = {}): string {
  return render(h(SlideRenderContext.Provider, { value: { ...DEFAULT_RENDER_INFO, ...info }, }, h(def.Component, { data })))
}

const expected: [typeof Lista, string[], string][] = [
  [Lista, ['Wyjazdy', 'Poznań i Kraków', 'θβℓιcℤε', 'OSSM', 'OSSM UJ, Kraków'], 'entries'],
  [Karty, ['Po co to wszystko', 'Koło to nie tylko matematyka', 'Pewność siebie', 'Doświadczenie', 'sylabusie'], 'cards'],
]

describe.each(expected)('układ %#', (def, texts, listKey) => {
  it.each(aspects)('rysuje domyślne teksty (%s)', (aspect) => {
    const out = html(def, def.defaults, { aspect })
    for (const t of texts) expect(out).toContain(t)
  })
  it.each([false, true])('odwrócony=%s też się rysuje', (mirrored) => {
    expect(html(def, def.defaults, { mirrored })).toContain(texts[1])
  })
  it('pola panelu istnieją w defaults, kroki = długość listy', () => {
    for (const f of def.fields) expect(Object.keys(def.defaults)).toContain(f.key)
    expect(def.steps?.(def.defaults)).toBe((def.defaults as Record<string, unknown[]>)[listKey].length)
  })
  it('pokazuje po kolei: przy kroku 1 tylko pierwszy element widoczny', () => {
    const out = html(def, def.defaults, { reveal: true, step: 1 })
    expect(out.match(/opacity:0;/g)?.length).toBe((def.defaults as Record<string, unknown[]>)[listKey].length - 1)
  })
})

describe('Karty', () => {
  it.each(aspects)('numerowana lista ma numery 01, 02… (%s)', (aspect) => {
    const out = html(Karty, { ...Karty.defaults, variant: 'numerowane' }, { aspect })
    expect(out).toContain('>01<')
    expect(out).toContain('>06<')
    expect(out).toContain('Pewność siebie')
  })
  it('siatka nie ma numerów', () => {
    expect(html(Karty, Karty.defaults)).not.toContain('>01<')
  })
  it('pusty wstęp jest ukryty poza edytorem', () => {
    expect(html(Karty, { ...Karty.defaults, lead: '' })).not.toContain('Wstęp')
  })
})

describe('Lista', () => {
  it.each(aspects)('bez zdjęcia rysuje wpisy (%s)', (aspect) => {
    const out = html(Lista, { ...Lista.defaults, showPhoto: false }, { aspect })
    expect(out).toContain('OSSM')
    expect(out).not.toContain('OSSM UJ, Kraków')
  })
})
