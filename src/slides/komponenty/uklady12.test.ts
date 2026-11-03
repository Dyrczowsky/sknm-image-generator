import { describe, expect, it } from 'vitest'
import { h, render } from '../../components/ui/testUtils'
import { DEFAULT_RENDER_INFO, SlideRenderContext } from '../defineSlide'
import type { SlideAspect } from '../types'
import Mozaika from './Mozaika'
import Qr from './Qr'
import Zaproszenie from './Zaproszenie'

const aspects: SlideAspect[] = ['16:9', '1:1']

function html(def: typeof Mozaika, aspect: SlideAspect, mirrored = false): string {
  const background = def.background ?? 'jasne'
  return render(
    h(SlideRenderContext.Provider, { value: { ...DEFAULT_RENDER_INFO, aspect, mirrored, background } }, h(def.Component, { data: def.defaults })),
  )
}

const expected: [typeof Mozaika, string[]][] = [
  [Mozaika, ['Nasza konferencja', 'WSAD', 'Ogólnopolskie Warsztaty Statystyki i Analizy Danych', 'machine learning', 'wsad.edu.pl']],
  [Zaproszenie, ['Zaproszenie', 'Wpadnij na spotkanie', '14 października', '19:30 · sala S3, GIL', 'strony WWW', 'PLAKAT']],
  [Qr, ['Dołącz do nas', 'Zeskanuj i zapisz się', 'https://sknm.pk.edu.pl']],
]

describe.each(expected)('układ %#', (def, texts) => {
  it.each(aspects)('rysuje domyślne teksty (%s)', (aspect) => {
    for (const mirrored of [false, true]) {
      const out = html(def, aspect, mirrored)
      for (const t of texts) expect(out).toContain(t)
    }
  })
  it('pola panelu istnieją w defaults, kroki to liczba', () => {
    for (const f of def.fields) expect(Object.keys(def.defaults)).toContain(f.key)
    expect(typeof (def.steps?.(def.defaults) ?? 0)).toBe('number')
  })
})

describe('kroki i QR', () => {
  it('Mozaika ma 4 kroki, Zaproszenie tyle, ile tagów', () => {
    expect(Mozaika.steps?.(Mozaika.defaults)).toBe(4)
    expect(Zaproszenie.steps?.(Zaproszenie.defaults)).toBe(7)
  })
  it('Qr rysuje svg', () => {
    for (const aspect of aspects) expect(html(Qr, aspect)).toContain('<svg')
  })
  it('Zaproszenie jest domyślnie na ciemnym tle', () => {
    expect(Zaproszenie.background).toBe('ciemne')
  })
})
