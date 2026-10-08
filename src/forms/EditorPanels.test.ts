import { createElement } from 'react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { AssetLibraryContext } from '../assets/AssetLibraryContext'
import { h, openingTag, render } from '../components/ui/testUtils'
import { EMPTY_FORM } from '../editor/formState'
import { posterRegistry } from '../posters/registry'
import type { FormValues } from '../types'
import { ContentPanel, LookPanel } from './EditorPanels'

const form = (over: Partial<FormValues> = {}): FormValues => ({ ...EMPTY_FORM, graphics: [], photos: {}, lists: {}, visibility: {}, ...over })
const content = (key: keyof typeof posterRegistry, value = form(), banner = false) =>
  render(h(ContentPanel, { poster: posterRegistry[key], banner, value, onChange: () => {} }))
const look = (key: keyof typeof posterRegistry, value = form(), banner = false) =>
  render(h(LookPanel, { poster: posterRegistry[key], banner, value, onChange: () => {} }))

const headings = (html: string) => [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1])
// Znacznik <button> o danej nazwie dostępnej (atrybuty w dowolnej kolejności).
const button = (html: string, label: string): string => {
  const tag = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0]
  if (!tag) throw new Error(`brak przycisku "${label}"`)
  return tag
}
const attr = (tag: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1]
// Nazwy dostępne sterowania: aria-label oraz etykiety pól.
const controlNames = (html: string) => [...html.matchAll(/ aria-label="([^"]*)"/g)].map((m) => m[1])

describe('ContentPanel (Treść)', () => {
  it('Wykład: Teksty i Kod QR, bez zdjęć i programu', () => {
    expect(headings(content('wyklad'))).toEqual(['Teksty', 'Kod QR'])
  })

  it('Gość: Teksty, Zdjęcia, Kod QR', () => {
    expect(headings(content('gosc'))).toEqual(['Teksty', 'Zdjęcia', 'Kod QR'])
  })

  it('Konferencja: Teksty, Program, Kod QR - program po tekstach', () => {
    const html = content('konferencja', form({ lists: { agenda: [{ time: '10:00', title: 'Otwarcie' }, {}] } }))
    expect(headings(html)).toEqual(['Teksty', 'Program', 'Kod QR'])
    expect(html).toContain('aria-label="Godzina, punkt 1"')
    expect(html).toContain('aria-label="Nazwa punktu, punkt 2"')
    expect(html).toContain('Dodaj punkt programu')
  })

  it('Komunikat: pole akapitu jest textarea z etykietą', () => {
    const html = content('komunikat')
    expect(headings(html)).toEqual(['Teksty', 'Kod QR'])
    const tag = openingTag(html, '<textarea')
    expect(html).toContain(`for="${attr(tag, 'id')}"`)
    expect(html).toContain('>Treść komunikatu</label>')
  })

  it('baner bez bannerPhoto: tylko Kod QR i podpowiedź o trybie', () => {
    const html = content('wyklad', form(), true)
    expect(headings(html)).toEqual(['Kod QR'])
    expect(html).toContain('Social media i druk')
    expect(html).not.toContain('Social media”')
    expect(html).not.toContain('type="file"')
  })

  it('baner z bannerPhoto (Gość): Zdjęcia i Kod QR, bez pól tekstowych', () => {
    const html = content('gosc', form(), true)
    expect(headings(html)).toEqual(['Zdjęcia', 'Kod QR'])
    expect(html).not.toContain('>Tytuł</label>')
    expect(html).toContain('type="file"')
  })

  it('każde pole tekstowe ma <label for> wskazujący jego id', () => {
    const html = content('gosc')
    const inputs = [...html.matchAll(/<(?:input|textarea)[^>]*>/g)].map((m) => m[0]).filter((tag) => !tag.includes('type="file"'))
    expect(inputs.length).toBeGreaterThanOrEqual(8)
    for (const tag of inputs) {
      const id = attr(tag, 'id')
      expect(id, tag).toBeTruthy()
      expect(html).toContain(`<label for="${id}"`)
    }
    expect(html).not.toContain('type="checkbox"')
  })

  it('przełącznik widoczności: pressed i nazwa zależą od stanu, pole zostaje edytowalne', () => {
    const shown = content('wyklad')
    expect(shown).toContain('aria-label="Ukryj na plakacie: Tytuł"')
    const tag = button(shown, 'Ukryj na plakacie: Tytuł')
    expect(tag).toContain('aria-pressed="true"')

    const hidden = content('wyklad', form({ visibility: { title: false } }))
    expect(button(hidden, 'Pokaż na plakacie: Tytuł')).toContain('aria-pressed="false"')
    expect(hidden).not.toContain('aria-label="Ukryj na plakacie: Tytuł"')
    const titleId = hidden.match(/<label for="([^"]+)"[^>]*>Tytuł<\/label>/)?.[1]
    const hiddenInput = hidden.match(new RegExp(`<input[^>]*id="${titleId}"[^>]*>`))?.[0] ?? ''
    expect(hiddenInput).toContain('opacity-60')
    expect(hiddenInput).not.toContain(' disabled=""')
    expect(hiddenInput).not.toContain('readOnly')
    // Widoczne pole nie jest przygaszone.
    expect(shown.match(/<input[^>]*opacity-60/)).toBeNull()
  })

  it('Kod QR jest w treści, a rozmiar tekstu i logotypy nie', () => {
    const html = content('gosc')
    expect(html).toContain('type="url"')
    expect(html).not.toContain('type="range"')
    expect(html).not.toContain('Logo Politechniki')
    expect(html).not.toContain('Wgraj grafiki')
  })

  it('bez wybranego szablonu panele są puste', () => {
    expect(render(h(ContentPanel, { poster: undefined, banner: false, value: form(), onChange: () => {} }))).toBe('')
    expect(render(h(LookPanel, { poster: undefined, banner: false, value: form(), onChange: () => {} }))).toBe('')
  })
})

describe('LookPanel (Wygląd)', () => {
  it('nagłówki: Rozmiar tekstu, Logotypy - dla każdego layoutu i banera', () => {
    for (const key of ['wyklad', 'gosc', 'konferencja', 'komunikat'] as const) {
      expect(headings(look(key))).toEqual(['Rozmiar tekstu', 'Logotypy'])
      expect(headings(look(key, form(), true))).toEqual(['Rozmiar tekstu', 'Logotypy'])
    }
  })

  it('dwa suwaki z etykietami <label for> i przełącznik „Przesuwaj razem"', () => {
    const html = look('wyklad', form({ scaleLinked: true, titleScale: 1.2 }))
    const ranges = [...html.matchAll(/<input[^>]*type="range"[^>]*>/g)].map((m) => m[0])
    expect(ranges).toHaveLength(2)
    for (const tag of ranges) expect(html).toContain(`<label for="${attr(tag, 'id')}"`)
    expect(ranges[0]).toContain('value="120"')
    expect(html).toContain('>120%<')
    expect(html.match(/<button[^>]*aria-pressed="true"[^>]*>(?:<svg.*?<\/svg>)Przesuwaj razem/)).not.toBeNull()
  })

  it('logo PK: przełącznik z aria-pressed i nazwą zależną od stanu', () => {
    const on = look('wyklad', form({ showPkLogo: true }))
    expect(button(on, 'Ukryj na plakacie: logo Politechniki Krakowskiej')).toContain('aria-pressed="true"')
    const off = look('wyklad', form({ showPkLogo: false }))
    expect(button(off, 'Pokaż na plakacie: logo Politechniki Krakowskiej')).toContain('aria-pressed="false"')
  })

  it('logotypy: wgrywanie w wyglądzie, bez kodu QR i bez „Z biblioteki" bez kontekstu', () => {
    const html = look('wyklad')
    expect(html).toContain('Wgraj grafiki')
    expect(openingTag(html, '<input class="absolute')).toContain('multiple')
    expect(html).not.toContain('type="url"')
    expect(html).not.toContain('Z biblioteki')
  })

  it('lista logotypów: strzałki w lewo / w prawo zgodne z etykietą, skrajne wyłączone, limit', () => {
    const html = look('wyklad', form({ graphics: ['data:a', 'data:b', 'data:c', 'data:d'] }))
    const left = [...html.matchAll(/<button[^>]*aria-label="Przesuń grafikę (\d) w lewo na plakacie"[^>]*>/g)]
    const right = [...html.matchAll(/<button[^>]*aria-label="Przesuń grafikę (\d) w prawo na plakacie"[^>]*>/g)]
    expect(left).toHaveLength(4)
    expect(right).toHaveLength(4)
    expect(left[0][0]).toContain(' disabled=""')
    expect(left[1][0]).not.toContain(' disabled=""')
    expect(right[3][0]).toContain(' disabled=""')
    expect(html).toContain('lucide-arrow-left')
    expect(html).toContain('lucide-arrow-right')
    expect(html).not.toContain('lucide-arrow-up')
    expect(html).toContain('Usuń grafikę 3 z plakatu')
    expect(html).toContain('Maksymalnie 4 grafiki.')
    expect(html).not.toContain('type="file"')
  })

  it('„Z biblioteki" tylko przy kontekście biblioteki', () => {
    const library = { items: [], loadThumbs: async () => {} }
    const el = createElement(AssetLibraryContext.Provider, { value: library as never }, h(LookPanel, { poster: posterRegistry.wyklad, banner: false, value: form(), onChange: () => {} })) as ReactElement
    expect(render(el)).toContain('Z biblioteki')
  })
})

describe('podział paneli', () => {
  it('żadna nazwa sterowania ani nagłówek nie występuje w obu panelach', () => {
    for (const key of ['wyklad', 'gosc', 'konferencja', 'komunikat'] as const) {
      for (const banner of [false, true]) {
        const a = content(key, form(), banner)
        const b = look(key, form(), banner)
        const shared = controlNames(a).filter((name) => controlNames(b).includes(name))
        expect(shared, `${key} ${banner}`).toEqual([])
        expect(headings(a).filter((x) => headings(b).includes(x))).toEqual([])
      }
    }
  })

  it('żaden panel nie jest <form> ani nie ma własnego paddingu zewnętrznego', () => {
    for (const html of [content('gosc'), look('gosc')]) {
      expect(html).not.toContain('<form')
      expect(html.slice(0, 80)).not.toMatch(/class="[^"]*\bp[xy]?-\d/)
    }
  })
})
