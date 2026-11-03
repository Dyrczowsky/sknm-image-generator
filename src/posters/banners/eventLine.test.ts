import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BannerEventLine } from './common'
import { PosterEditContext } from '../edit'
import type { PosterLang, RawPosterData } from '../../types'

const html = (data: RawPosterData, lang: PosterLang = 'pl') => renderToStaticMarkup(createElement(BannerEventLine, { data, lang }))
// Sam tekst, bez znaczników.
const text = (data: RawPosterData, lang?: PosterLang) => html(data, lang).replace(/<[^>]+>/g, '')

const editing = (data: RawPosterData) =>
  renderToStaticMarkup(createElement(PosterEditContext.Provider, { value: { editable: true, onText: () => {} } }, createElement(BannerEventLine, { data, lang: 'pl' })))

const EVENT = { event_date: '2026-11-27', event_time: '15:00', location: 'Działownia' }

describe('BannerEventLine', () => {
  it('przełącznik wyłączony: nic, nawet z wypełnionymi polami', () => {
    expect(html({ ...EVENT })).toBe('')
    expect(html({ ...EVENT, bannerShowEvent: false })).toBe('')
  })

  it('data, godzina i miejsce połączone separatorem', () => {
    expect(text({ ...EVENT, bannerShowEvent: true })).toBe('27 lis · 15:00 · Działownia')
  })

  it('tylko wypełnione części, bez wartości przykładowych', () => {
    expect(text({ location: 'Działownia', bannerShowEvent: true })).toBe('Działownia')
    expect(text({ event_time: '15:00', bannerShowEvent: true })).toBe('15:00')
  })

  it('włączony, ale pola puste (także same znaczniki formatu): brak elementu', () => {
    expect(html({ bannerShowEvent: true })).toBe('')
    expect(html({ location: '', bannerShowEvent: true })).toBe('')
  })

  it('angielska data', () => {
    expect(text({ ...EVENT, bannerShowEvent: true }, 'en')).toBe('27 Nov · 15:00 · Działownia')
  })

  it('oko na plakacie nie ukrywa pola na banerze', () => {
    expect(text({ ...EVENT, bannerShowEvent: true, visibility: { location: false, event_date: false } })).toBe('27 lis · 15:00 · Działownia')
  })

  it('w edycji puste miejsce zostaje polem z podpowiedzią - nie znika spod kursora', () => {
    const out = editing({ event_time: '15:00', location: '', bannerShowEvent: true })
    expect(out).toContain('aria-label="Lokalizacja"')
    expect(out).toContain('data-placeholder="Lokalizacja"')
    // Także bez daty i godziny linia zostaje (samo pole miejsca).
    expect(editing({ bannerShowEvent: true })).toContain('aria-label="Lokalizacja"')
    // Wyłączony przełącznik: nic, także w edycji.
    expect(editing({ location: 'Sala' })).toBe('')
  })
})
