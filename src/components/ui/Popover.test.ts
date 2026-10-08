import { describe, expect, it } from 'vitest'
import { IconButton } from './IconButton'
import { Popover } from './Popover'
import type { PopoverTriggerProps } from './Popover'
import { h, openingTag, render } from './testUtils'

const trigger = (props: PopoverTriggerProps) => h(IconButton, { ...props, icon: 'help', label: 'Pomoc' })
const renderPopover = (over: object = {}) => render(h(Popover, { trigger, label: 'Pomoc i skróty', ...over }, h('p', null, 'Lista skrótów')))

describe('Popover', () => {
  it('zamknięty: przycisk z aria-expanded="false" i aria-haspopup, panelu nie ma w drzewie', () => {
    const html = renderPopover()
    const button = openingTag(html, '<button')
    expect(button).toContain('aria-expanded="false"')
    expect(button).toContain('aria-haspopup="dialog"')
    expect(button).not.toContain('aria-controls')
    expect(button).toContain('aria-label="Pomoc"')
    expect(html).not.toContain('Lista skrótów')
  })

  it('otwarty: panel role="dialog" z nazwą, wskazany przez aria-controls, z fokusem programowym', () => {
    const html = renderPopover({ open: true, onOpenChange: () => {} })
    const button = openingTag(html, '<button')
    expect(button).toContain('aria-expanded="true"')
    const id = / aria-controls="([^"]+)"/.exec(button)?.[1]
    expect(id).toBeTruthy()
    const panel = openingTag(html, `<div id="${id}"`)
    expect(panel).toContain('role="dialog"')
    expect(panel).toContain('aria-label="Pomoc i skróty"')
    expect(panel).toContain('tabindex="-1"')
    expect(panel).not.toContain('hidden')
    expect(html).toContain('Lista skrótów')
  })

  it('role="menu" trafia na panel i do aria-haspopup', () => {
    const html = renderPopover({ open: true, role: 'menu' })
    expect(openingTag(html, '<button')).toContain('aria-haspopup="menu"')
    expect(html).toMatch(/<div id="[^"]+" role="menu"/)
  })

  it('keepMounted: zamknięty panel zostaje w drzewie z `hidden`', () => {
    const html = renderPopover({ keepMounted: true })
    expect(html).toMatch(/<div id="[^"]+" role="dialog"[^>]*hidden=""/)
    expect(html).toContain('Lista skrótów')
    expect(openingTag(html, '<button')).toContain('aria-controls=')
  })

  it('treść-funkcja dostaje `close`', () => {
    const html = render(h(Popover, { trigger, label: 'Konto', open: true }, (close: unknown) => h('span', null, typeof close)))
    expect(html).toContain('<span>function</span>')
  })

  it('align="end" przypina panel do prawej krawędzi przycisku, side="top" nad nim', () => {
    expect(renderPopover({ open: true })).toContain('top-full mt-1.5 left-0')
    expect(renderPopover({ open: true, align: 'end', side: 'top' })).toContain('bottom-full mb-1.5 right-0')
  })
})
