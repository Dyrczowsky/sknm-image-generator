import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'
import { h, openingTag, render } from './ui/testUtils'

const shell = (page: string) =>
  render(h(AppShell, { page, topBar: h('header', null, 'PASEK'), editor: h('div', { id: 'podglad' }, 'EDYTOR') }, h('p', null, 'STRONA_POBOCZNA')))

describe('AppShell', () => {
  it('ma jeden landmark <main>, a górny pasek stoi przed nim', () => {
    const html = shell('editor')
    expect(html.match(/<main/g)).toHaveLength(1)
    expect(html.indexOf('PASEK')).toBeLessThan(html.indexOf('<main'))
  })

  it('na stronie edytora: edytor czynny, strony pobocznej nie ma', () => {
    const html = shell('editor')
    const editor = openingTag(html, '<div data-page="editor"')
    expect(editor).not.toContain('inert')
    expect(editor).not.toContain('left-[-200vw]')
    expect(html).toContain('EDYTOR')
    expect(html).not.toContain('STRONA_POBOCZNA')
  })

  it('na stronie pobocznej edytor ZOSTAJE w drzewie - schowany przez inert i wysunięcie poza okno', () => {
    for (const page of ['projects', 'assets', 'history', 'notes']) {
      const html = shell(page)
      const editor = openingTag(html, '<div data-page="editor"')
      expect(editor, page).toContain('inert=""')
      expect(editor, page).toContain('fixed')
      expect(editor, page).toContain('left-[-200vw]')
      expect(html, page).toContain('<div id="podglad">EDYTOR</div>')
      expect(html, page).toContain('STRONA_POBOCZNA')
      expect(html, page).toContain(`data-page="${page}"`)
    }
  })

  it('schowany edytor nie jest ukrywany przez display:none ani visibility (eksport kopiuje obliczone style węzła)', () => {
    const editor = openingTag(shell('history'), '<div data-page="editor"')
    expect(editor).not.toMatch(/ hidden(=|\s|>)/)
    expect(editor).not.toMatch(/class="[^"]*\b(hidden|invisible)\b/)
  })
})
