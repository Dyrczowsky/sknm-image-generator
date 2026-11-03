import { describe, expect, it } from 'vitest'
import { MAX_DURATION, TRANSITION_KEYS } from '../types'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EditableText } from '../komponenty/_tekst'
import { buildHtmlDocument, EDITOR_ATTRS, escapeHtml } from './html'
import type { PlayerSlide } from './html'
import { PLAYER_CSS, PLAYER_SCRIPT } from './player'

const slides: PlayerSlide[] = [
  { steps: 0, transition: 'przenikanie', bg: '#ffffff' },
  { steps: 3, transition: 'obrot', bg: '#3C459B' },
]

const build = (overrides: Partial<Parameters<typeof buildHtmlDocument>[0]> = {}) =>
  buildHtmlDocument({
    title: 'Wykład <1> & "fajrant"',
    fontCss: '@font-face { font-family: X; }',
    wide: ['<div>szeroki-A</div>', '<div>szeroki-B</div>'],
    square: ['<div>kwadrat-A</div>', '<div>kwadrat-B</div>'],
    slides,
    duration: 600,
    ...overrides,
  })

function deckData(html: string) {
  const match = html.match(/<script type="application\/json" id="deck-data">([\s\S]*?)<\/script>/)
  if (!match) throw new Error('brak deck-data')
  return JSON.parse(match[1])
}

describe('buildHtmlDocument', () => {
  const html = build()

  it('ma nagłówek dokumentu', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<html lang="pl">')
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toContain('name="viewport"')
  })

  it('escapuje tytuł', () => {
    expect(html).toContain('<title>Wykład &lt;1&gt; &amp; &quot;fajrant&quot;</title>')
  })

  it('zawiera fonty i style odtwarzacza', () => {
    expect(html).toContain('@font-face { font-family: X; }')
    expect(html).toContain(PLAYER_CSS)
  })

  it('ma obie sceny z wymiarami układu', () => {
    expect(html).toContain('id="stage-wide" data-w="1600" data-h="900"')
    expect(html).toContain('id="stage-square" data-w="1200" data-h="1200"')
  })

  it('zawiera treść slajdów w kolejności', () => {
    const order = ['szeroki-A', 'szeroki-B', 'kwadrat-A', 'kwadrat-B'].map((s) => html.indexOf(s))
    expect(order.every((i) => i > 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(html.indexOf('szeroki-B')).toBeLessThan(html.indexOf('id="stage-square"'))
  })

  it('zawiera skrypt odtwarzacza', () => {
    expect(html).toContain(`<script>${PLAYER_SCRIPT}</script>`)
  })

  it('dane: slajdy, czas i przejścia w obu kierunkach', () => {
    const data = deckData(html)
    expect(data.slides).toEqual(slides)
    expect(data.duration).toBe(600)
    for (const key of TRANSITION_KEYS) {
      for (const dir of ['1', '-1']) {
        const frames = data.transitions[key][dir]
        expect(Array.isArray(frames.enter)).toBe(true)
        expect(Array.isArray(frames.exit)).toBe(true)
        expect(typeof frames.enterOnTop).toBe('boolean')
        expect(typeof frames.easing).toBe('string')
      }
      expect(TRANSITION_KEYS).toContain(data.reduced[key].key)
    }
  })

  it('ogranicza czas przejścia', () => {
    expect(deckData(build({ duration: 99999 })).duration).toBe(MAX_DURATION)
  })

  it('treść nie może zamknąć skryptu danych', () => {
    const evil = build({ slides: [{ steps: 0, transition: 'brak', bg: '</script><b>x' }] })
    expect(deckData(evil).slides[0].bg).toBe('</script><b>x')
  })
})

describe('escapeHtml', () => {
  it('zamienia znaki specjalne', () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
  })
})

describe('PLAYER_SCRIPT', () => {
  it('jest poprawnym JS', () => {
    expect(() => new Function(PLAYER_SCRIPT)).not.toThrow()
  })
})

describe('eksport sformatowanego tekstu', () => {
  it('slajd poza edytorem ma style, bez pól edytora i znaków sterujących', () => {
    const html = renderToStaticMarkup(h(EditableText, { path: 'x', value: '\uE000Ala \uE101ma', as: 'p' }))
    expect(html).toContain('font-weight:bolder')
    for (const forbidden of ['data-rich-field', 'contenteditable', '\uE000', '\uE100', '\uE101']) {
      expect(html.toLowerCase()).not.toContain(forbidden.toLowerCase())
    }
  })

  it('atrybuty pola formatowania są zdejmowane z kopii slajdu', () => {
    expect(EDITOR_ATTRS).toEqual(expect.arrayContaining(['data-rich-field', 'data-alignable']))
  })
})
