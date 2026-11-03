import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { posterRegistry } from './registry'
import type { QrSide } from '../types'

const html = (key: string, qrSide?: QrSide, qrUrl = 'https://sknm.pk.edu.pl') =>
  renderToStaticMarkup(createElement(posterRegistry[key].Component, { data: { qrUrl, qrSide, event_date: '2026-11-27' } }))

const svgCount = (markup: string) => markup.split('<svg').length - 1

describe('qrSide', () => {
  it.each(['gala', 'wyklad'])('%s: kod QR we własnym wierszu nad stopką, przed datą', (key) => {
    const markup = html(key)
    const qr = markup.indexOf('<svg', markup.indexOf('flex-direction:column;position:relative;z-index:1'))
    expect(qr).toBeGreaterThan(-1)
    // Wiersz z kodem stoi przed liczbą dnia (27) w kolejności dokumentu.
    expect(qr).toBeLessThan(markup.lastIndexOf('>27<'))
  })

  it.each(['gala', 'wyklad'])('%s: lewa strona nad datą, prawa nad logotypami', (key) => {
    expect(html(key, 'left')).toContain('justify-content:flex-start;margin:0 0 0 -12px')
    expect(html(key, 'right')).toContain('justify-content:flex-end;margin:0 -12px 0 0')
    // Domyślnie (stare zapisy bez pola) - po lewej.
    expect(html(key)).toContain('justify-content:flex-start;margin:0 0 0 -12px')
  })

  it.each(['gala', 'wyklad'])('%s: bez linku nie ma wiersza z kodem', (key) => {
    expect(svgCount(html(key, 'left', ''))).toBe(svgCount(html(key, 'left', 'https://x.pl')) - 1)
  })

  it('pozostałe szablony: QR w rzędzie stopki, po lewej albo przy logotypach', () => {
    expect(html('data', 'left')).toContain('display:flex;margin-right:auto')
    expect(html('data', 'right')).not.toContain('display:flex;margin-right:auto')
  })
})
