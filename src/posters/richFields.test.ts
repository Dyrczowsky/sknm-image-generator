import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { serializeRich, MARK } from '../richText'
import { PosterEditContext } from './edit'
import { posterRegistry } from './registry'
import type { RawPosterData } from '../types'

type PosterComponent = (typeof posterRegistry)[string]['Component']

const html = (Component: PosterComponent, data: RawPosterData) => renderToStaticMarkup(createElement(Component, { data }))

const editingHtml = (Component: PosterComponent, data: RawPosterData) =>
  renderToStaticMarkup(
    createElement(PosterEditContext.Provider, { value: { editable: true, onText: () => {} } }, createElement(Component, { data })),
  )

// „<słowo> pogrubione" - pierwszy fragment pogrubiony.
const bold = (word: string) => serializeRich([{ align: 'left', runs: [{ text: word, marks: MARK.bold }, { text: ' zwykłe', marks: 0 }] }])

// Znaki sterujące formatu (U+E000-U+E1FF) nie mogą wyciec do HTML.
const CONTROL = /[\uE000-\uE1FF]/

// Wszystkie pola tekstowe wypełnione - snapshot łapie każde miejsce, w którym
// szablon rysuje tekst z formularza.
const FULL: RawPosterData = {
  title: 'Tytuł <b> & co',
  subtitle: 'Podtytuł <i> & co',
  speaker: 'Prelegent & <x>',
  location: 'Sala <1> & 2',
  badge: 'Plakietka & <p>',
  badge2: 'Druga & <p>',
  body: 'Treść & <t>\nDruga linia',
  event_date: '2026-11-12',
  event_time: '18:30',
  lists: { agenda: [{ time: '09:00', title: 'Punkt <a> & b', subtitle: 'Opis & <c>' }, { time: '10:00', title: 'Drugi' }] },
}

// Data/godzina przykładowa to „dziś" - zegar stoi w miejscu.
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 29, 12, 0))
})
afterAll(() => {
  vi.useRealTimers()
})

// HTML sprzed formatowania: niesformatowane dane mają dawać dokładnie ten sam
// plakat.
describe('plakaty: HTML bez formatowania jak przed zmianą', () => {
  for (const [key, entry] of Object.entries(posterRegistry)) {
    it(`${key}: puste dane`, () => {
      expect(html(entry.Component, {})).toMatchSnapshot()
    })

    it(`${key}: tytuł z <&`, () => {
      expect(html(entry.Component, { title: 'A <b> & C' })).toMatchSnapshot()
    })

    it(`${key}: wszystkie pola`, () => {
      expect(html(entry.Component, FULL)).toMatchSnapshot()
    })
  }
})

describe('plakaty: formatowanie pól tekstowych', () => {
  // Każde pole tekstowe sformatowane - żadne nie może pokazać surowych znaczników.
  const ALL_BOLD: RawPosterData = {
    title: bold('Tytuł'),
    subtitle: bold('Podtytuł'),
    speaker: bold('Prelegent'),
    location: bold('Sala'),
    badge: bold('Plakietka'),
    badge2: bold('Druga'),
    body: bold('Treść'),
    lists: { agenda: [{ time: '09:00', title: bold('Punkt'), subtitle: bold('Opis') }] },
  }

  for (const [key, entry] of Object.entries(posterRegistry)) {
    it(`${key}: pogrubione słowo w tytule rysuje się bez znaczników`, () => {
      const out = html(entry.Component, { title: bold('Gruby') })
      expect(out).toContain('<span style="font-weight:bolder">Gruby</span>')
      expect(out).not.toMatch(CONTROL)
    })

    it(`${key}: żadne pole nie pokazuje znaczników formatu`, () => {
      expect(html(entry.Component, ALL_BOLD)).not.toMatch(CONTROL)
      expect(editingHtml(entry.Component, ALL_BOLD)).not.toMatch(CONTROL)
    })

    it(`${key}: pole z samymi znacznikami jest puste jak brak wartości`, () => {
      const empty = '\uE000\uE101'
      const markersOnly = { title: empty, subtitle: empty, speaker: empty, location: empty, badge: empty, badge2: empty, body: empty }
      expect(html(entry.Component, markersOnly)).toBe(html(entry.Component, {}))
    })

    it(`${key}: w edytorze tytuł jest edytowalny`, () => {
      expect(editingHtml(entry.Component, {})).toMatch(/contentEditable="true"[^>]*data-poster-edit/)
    })
  }

  for (const key of ['komunikat', 'ogloszenie']) {
    it(`${key}: podpis wielkimi literami przez CSS, „— " poza polem`, () => {
      const out = html(posterRegistry[key].Component, { subtitle: 'abc' })
      expect(out).toContain('— <span style="text-transform:uppercase">abc</span>')
    })
  }

  it('konferencja: punkty programu domyślnego są edytowalne z podpisem jak w formularzu', () => {
    const out = editingHtml(posterRegistry.konferencja.Component, {})
    expect(out).toContain('aria-label="Nazwa punktu, punkt 1"')
    expect(out).toContain('aria-label="Prelegent / opis, punkt 3"')
  })
})
