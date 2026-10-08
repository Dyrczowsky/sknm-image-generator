import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'
import { Icon } from './Icon'
import { h, openingTag, render } from './testUtils'

describe('Badge', () => {
  it('licznik: sama liczba w pigułce o stałej szerokości cyfr', () => {
    const html = render(h(Badge, null, 3))
    expect(html).toMatch(/^<span class="[^"]*rounded-full[^"]*tabular-nums[^"]*">3<\/span>$/)
  })

  it('srLabel dopowiada znaczenie liczby czytnikowi ekranu', () => {
    const html = render(h(Badge, { tone: 'accent', srLabel: 'otwarte notatki' }, 3))
    expect(html).toContain('3<span class="sr-only"> otwarte notatki</span>')
  })

  it('stan niesie tekst i ikona, nie sam kolor; ikona jest ozdobą', () => {
    const html = render(h(Badge, { tone: 'success', icon: 'saved' }, 'Zapisano'))
    expect(html).toContain('Zapisano')
    expect(openingTag(html, '<svg')).toContain('aria-hidden="true"')
  })

  it('każdy ton ma inne klasy', () => {
    const tones = ['neutral', 'accent', 'success', 'warning', 'danger'] as const
    const classes = tones.map((tone) => openingTag(render(h(Badge, { tone }, 'x')), '<span'))
    expect(new Set(classes).size).toBe(tones.length)
  })
})

describe('Icon', () => {
  it('bez etykiety jest ukryta przed czytnikiem i poza kolejką fokusu', () => {
    const tag = openingTag(render(h(Icon, { name: 'download' })), '<svg')
    expect(tag).toContain('aria-hidden="true"')
    expect(tag).toContain('focusable="false"')
    expect(tag).not.toContain('role=')
  })

  it('z etykietą staje się obrazem z nazwą', () => {
    const tag = openingTag(render(h(Icon, { name: 'alert', label: 'Uwaga' })), '<svg')
    expect(tag).toContain('role="img"')
    expect(tag).toContain('aria-label="Uwaga"')
    expect(tag).not.toContain('aria-hidden')
  })

  it('rozmiary są stałe: sm 16, md 18, lg 24', () => {
    const size = (name: 'sm' | 'md' | 'lg') => / width="(\d+)"/.exec(openingTag(render(h(Icon, { name: 'trash', size: name })), '<svg'))?.[1]
    expect([size('sm'), size('md'), size('lg')]).toEqual(['16', '18', '24'])
  })

  it('różne nazwy dają różne rysunki', () => {
    expect(render(h(Icon, { name: 'eye' }))).not.toBe(render(h(Icon, { name: 'eyeOff' })))
  })
})
