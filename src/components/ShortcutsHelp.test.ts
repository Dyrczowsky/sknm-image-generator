import { describe, expect, it } from 'vitest'
import { ShortcutsHelp } from './ShortcutsHelp'
import { h, openingTag, render } from './ui/testUtils'

const noop = () => {}
const help = (over: object = {}) =>
  render(h(ShortcutsHelp, { enabled: ['save', 'tabContent', 'help'], isMac: false, open: true, onOpenChange: noop, onTicket: noop, ...over }))

describe('ShortcutsHelp', () => {
  it('zamknięta: sam przycisk z nazwą, bez panelu w drzewie', () => {
    const html = help({ open: false })
    const button = openingTag(html, '<button')
    expect(button).toContain('aria-label="Pomoc i skróty klawiszowe"')
    expect(button).toContain('aria-expanded="false"')
    expect(button).toContain('aria-haspopup="dialog"')
    expect(html).not.toContain('<kbd')
    expect(html).not.toContain('Zgłoś błąd')
  })

  it('otwiera się tylko stanem `open` - bez klas reagujących na najechanie', () => {
    const html = help({ open: false })
    expect(html).not.toContain('group-hover')
    expect(html).not.toContain('focus-visible]:block')
  })

  it('otwarta: panel „Pomoc" wskazany przez aria-controls', () => {
    const html = help()
    const button = openingTag(html, '<button')
    expect(button).toContain('aria-expanded="true"')
    const id = / aria-controls="([^"]+)"/.exec(button)?.[1]
    expect(id).toBeTruthy()
    const panel = openingTag(html, `<div id="${id}"`)
    expect(panel).toContain('role="dialog"')
    expect(panel).toContain('aria-label="Pomoc"')
  })

  it('lista zawiera dokładnie włączone skróty', () => {
    const html = help()
    expect(html).toContain('Zapisz projekt')
    expect(html).toContain('Ctrl+S')
    expect(html).toContain('Alt+2')
    expect(html).toContain('Pokaż skróty klawiszowe')
    expect(html).not.toContain('Pobierz plakat')
    expect(html.match(/<kbd/g)).toHaveLength(3)
  })

  it('na Macu pokazuje ⌘ i ⌥', () => {
    const html = help({ isMac: true })
    expect(html).toContain('⌘S')
    expect(html).toContain('⌥2')
  })

  it('ma oba wejścia do zgłoszeń', () => {
    const html = help()
    expect(html).toMatch(/<button[^>]*>.*?Zgłoś błąd<\/button>/)
    expect(html).toMatch(/<button[^>]*>.*?Zgłoś zapotrzebowanie na plakat<\/button>/)
  })
})
