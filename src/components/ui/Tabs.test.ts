import { describe, expect, it } from 'vitest'
import { rovingTarget } from './keys'
import { TabList, TabPanel, Tabs } from './Tabs'
import { h, render } from './testUtils'

const TABS = [
  { value: 'template', label: 'Szablon' },
  { value: 'content', label: 'Treść' },
  { value: 'look', label: 'Wygląd' },
] as const

const renderTabs = (value: string, tabs: readonly object[] = TABS) =>
  render(
    h(Tabs, { value, onChange: () => {} },
      h(TabList, { label: 'Sekcje edytora', tabs }),
      h(TabPanel, { value: 'template' }, 'szablony'),
      h(TabPanel, { value: 'content', className: 'flex' }, h('input', { name: 'tytul' })),
      h(TabPanel, { value: 'look' }, 'suwaki'),
    ),
  )

const tabTags = (html: string) => [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => m[0])
const panelTags = (html: string) => [...html.matchAll(/<div[^>]*role="tabpanel"[^>]*>/g)].map((m) => m[0])
const attr = (tag: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1]

describe('Tabs', () => {
  it('lista ma role="tablist" i nazwę, każda zakładka to <button role="tab">', () => {
    const html = renderTabs('content')
    expect(html).toMatch(/<div role="tablist" aria-label="Sekcje edytora"/)
    const tabs = tabTags(html)
    expect(tabs).toHaveLength(3)
    for (const tab of tabs) expect(tab).toContain('type="button"')
  })

  it('aria-selected tylko na aktywnej; roving tabindex: aktywna 0, reszta -1', () => {
    const tabs = tabTags(renderTabs('content'))
    expect(tabs.map((tab) => attr(tab, 'aria-selected'))).toEqual(['false', 'true', 'false'])
    expect(tabs.map((tab) => attr(tab, 'tabindex'))).toEqual(['-1', '0', '-1'])
  })

  it('zakładka i panel wskazują na siebie (aria-controls / aria-labelledby)', () => {
    const html = renderTabs('content')
    const tabs = tabTags(html)
    const panels = panelTags(html)
    expect(panels).toHaveLength(3)
    tabs.forEach((tab, i) => {
      expect(attr(tab, 'aria-controls')).toBe(attr(panels[i] ?? '', 'id'))
      expect(attr(panels[i] ?? '', 'aria-labelledby')).toBe(attr(tab, 'id'))
    })
    expect(new Set(tabs.map((tab) => attr(tab, 'id'))).size).toBe(3)
  })

  it('nieaktywne panele są ukryte (`hidden`), ale ich treść ZOSTAJE w drzewie', () => {
    const html = renderTabs('template')
    const panels = panelTags(html)
    expect(panels.map((panel) => panel.includes('hidden=""'))).toEqual([false, true, true])
    expect(html).toContain('name="tytul"')
    expect(html).toContain('suwaki')
  })

  it('stan zaznaczenia nie wisi na samym kolorze: pogrubienie i podkreślenie', () => {
    const tab = tabTags(renderTabs('content'))[0] ?? ''
    expect(tab).toContain('aria-selected:font-bold')
    expect(tab).toContain('aria-selected:after:bg-accent')
  })

  it('wyłączona zakładka ma `disabled`; nieznana wartość zostawia w kolejce Tab pierwszą dostępną', () => {
    const tabs = tabTags(renderTabs('brak', [{ value: 'template', label: 'Szablon', disabled: true }, TABS[1], TABS[2]]))
    expect(tabs[0]).toContain('disabled=""')
    expect(tabs.map((tab) => attr(tab, 'tabindex'))).toEqual(['-1', '0', '-1'])
  })

  it('TabList poza Tabs zgłasza czytelny błąd', () => {
    expect(() => render(h(TabList, { label: 'x', tabs: TABS }))).toThrow(/wewnątrz <Tabs>/)
  })
})

describe('rovingTarget (strzałki w liście zakładek)', () => {
  const all = [true, true, true]

  it('strzałki w prawo / w lewo przechodzą do sąsiada i zawijają się na końcach', () => {
    expect(rovingTarget('ArrowRight', 0, all)).toBe(1)
    expect(rovingTarget('ArrowRight', 2, all)).toBe(0)
    expect(rovingTarget('ArrowLeft', 0, all)).toBe(2)
    expect(rovingTarget('ArrowLeft', 2, all)).toBe(1)
  })

  it('Home i End skaczą na pierwszą i ostatnią', () => {
    expect(rovingTarget('Home', 2, all)).toBe(0)
    expect(rovingTarget('End', 0, all)).toBe(2)
  })

  it('pozycje wyłączone są pomijane', () => {
    expect(rovingTarget('ArrowRight', 0, [true, false, true])).toBe(2)
    expect(rovingTarget('ArrowLeft', 0, [true, true, false])).toBe(1)
    expect(rovingTarget('Home', 2, [false, true, true])).toBe(1)
    expect(rovingTarget('End', 0, [true, true, false])).toBe(1)
  })

  it('inne klawisze i lista bez dostępnych pozycji → null', () => {
    expect(rovingTarget('Enter', 0, all)).toBeNull()
    expect(rovingTarget('Tab', 0, all)).toBeNull()
    expect(rovingTarget('ArrowRight', 0, [false, false])).toBeNull()
  })

  it('jedyna dostępna pozycja zostaje na miejscu', () => {
    expect(rovingTarget('ArrowRight', 1, [false, true, false])).toBe(1)
  })
})
