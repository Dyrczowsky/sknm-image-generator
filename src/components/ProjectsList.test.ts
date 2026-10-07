import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import type { ProjectRow } from '../projects/remoteProjects'
import type { EditorSnapshot } from '../snapshot/snapshot'
import { ProjectsList } from './ProjectsList'

const noop = () => {}
const SNAPSHOT: EditorSnapshot = {
  v: 1, poster_key: 'wyklad', color_scheme: null, lang: 'pl', export: DEFAULT_EXPORT_SETTINGS,
  form: { ...EMPTY_FORM, graphics: [], photos: {}, title: 'Mój wykład' },
}
const row = (id: number, patch: Partial<ProjectRow> = {}): ProjectRow => ({
  id, created_at: '2031-03-04T09:05:00', updated_at: '2031-03-04T09:05:00', owner: 'me', owner_email: 'ja@klub.pl',
  name: `Projekt ${id}`, shared: false, revision: 1, snapshot: SNAPSHOT, ...patch,
})

const render = (projects: ProjectRow[], currentId: number | null = null) =>
  renderToStaticMarkup(
    createElement(ProjectsList, { projects, userId: 'me', currentId, lang: 'pl', onOpen: noop, onRename: noop, onShare: noop, onDelete: noop }),
  )

describe('ProjectsList', () => {
  it('pusta lista', () => {
    expect(render([])).toContain('Nie masz jeszcze zapisanych projektów.')
  })

  it('własny projekt: nazwa, data i komplet akcji', () => {
    const html = render([row(1, { name: 'Wykład wiosenny' })])
    expect(html).toContain('Wykład wiosenny')
    expect(html).toContain('zmieniono 2031-03-04 09:05')
    expect(html).toContain('>Otwórz<')
    expect(html).toContain('Zmień nazwę')
    expect(html).toContain('Udostępnij zespołowi')
    expect(html).toContain('>Usuń<')
    expect(html).not.toContain('Otwórz kopię')
    expect(html).not.toContain('Udostępnił(a)')
  })

  it('checkbox udostępniania odzwierciedla shared', () => {
    expect(render([row(1, { shared: true })])).toContain('checked=""')
    expect(render([row(1, { shared: false })])).not.toContain('checked=""')
  })

  it('cudzy projekt: autor i tylko „Otwórz kopię"', () => {
    const html = render([row(2, { owner: 'other', owner_email: 'ona@klub.pl', shared: true })])
    expect(html).toContain('Udostępnił(a): ona@klub.pl')
    expect(html).toContain('Otwórz kopię')
    expect(html).not.toContain('>Otwórz<')
    expect(html).not.toContain('Zmień nazwę')
    expect(html).not.toContain('Udostępnij zespołowi')
    expect(html).not.toContain('Usuń')
    expect(html).not.toContain('type="checkbox"')
  })

  it('otwarty projekt: plakietka i aria-current tylko na nim', () => {
    const html = render([row(1), row(2)], 2)
    expect(html.match(/aria-current/g)).toHaveLength(1)
    expect(html.match(/Otwarty/g)).toHaveLength(1)
    expect(render([row(1)])).not.toContain('Otwarty')
  })

  it('nieczytelny snapshot: szara miniatura, notka i brak przycisku otwarcia', () => {
    const html = render([row(3, { snapshot: { v: 99 } })])
    expect(html).toContain('bg-border')
    expect(html).toContain('Wymaga nowszej wersji aplikacji')
    expect(html).not.toContain('Otwórz')
    expect(html).toContain('>Usuń<')
  })

  it('cudzy nieczytelny snapshot: bez żadnej akcji', () => {
    const html = render([row(4, { owner: 'other', snapshot: null })])
    expect(html).toContain('Wymaga nowszej wersji aplikacji')
    expect(html).not.toContain('<button')
  })
})
