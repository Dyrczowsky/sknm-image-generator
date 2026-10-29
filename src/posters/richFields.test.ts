import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { posterRegistry } from './registry'
import type { RawPosterData } from '../types'

const html = (Component: (typeof posterRegistry)[string]['Component'], data: RawPosterData) =>
  renderToStaticMarkup(createElement(Component, { data }))

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

// HTML sprzed formatowania: niesformatowane dane mają dawać dokładnie ten sam
// plakat. Data/godzina przykładowa to „dziś" - zegar stoi w miejscu.
describe('plakaty: HTML bez formatowania jak przed zmianą', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 29, 12, 0))
  })
  afterAll(() => {
    vi.useRealTimers()
  })

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
