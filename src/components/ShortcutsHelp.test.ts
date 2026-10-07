import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ShortcutsHelp } from './ShortcutsHelp'

const render = (over: Partial<Parameters<typeof ShortcutsHelp>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(ShortcutsHelp, { enabled: ['save', 'help'], isMac: false, open: false, onOpenChange: () => {}, ...over }),
  )

describe('ShortcutsHelp', () => {
  it('przycisk ma nazwę „Skróty klawiszowe"', () => {
    expect(render()).toContain('aria-label="Skróty klawiszowe"')
  })
  it('lista zawiera dokładnie włączone skróty', () => {
    const html = render()
    expect(html).toContain('Zapisz projekt')
    expect(html).toContain('<kbd')
    expect(html).toContain('Ctrl+S')
    expect(html).toContain('Pokaż skróty klawiszowe')
    expect(html).not.toContain('Pobierz plakat')
    expect(html.match(/<kbd/g)).toHaveLength(2)
  })
  it('na Macu pokazuje ⌘', () => {
    expect(render({ isMac: true })).toContain('⌘S')
  })
  it('aria-expanded odzwierciedla open, aria-controls wskazuje popup', () => {
    expect(render({ open: false })).toContain('aria-expanded="false"')
    const html = render({ open: true })
    expect(html).toContain('aria-expanded="true"')
    const id = /aria-controls="([^"]+)"/.exec(html)?.[1]
    expect(id).toBeTruthy()
    expect(html).toContain(`id="${id}"`)
  })
})
