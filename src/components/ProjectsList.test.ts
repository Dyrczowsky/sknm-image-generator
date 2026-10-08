import { readFileSync } from 'node:fs'
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
  it('bez projektów: dwie sekcje, każda z własnym komunikatem', () => {
    const html = render([])
    expect(html).toContain('Moje projekty')
    expect(html).toContain('Udostępnione przez zespół')
    expect(html).toContain('Nie masz jeszcze zapisanych projektów.')
    expect(html).toContain('Nikt jeszcze nie udostępnił zespołowi swojego projektu.')
    expect(html).not.toContain('<ul')
  })

  it('własny projekt: nazwa, data i komplet akcji', () => {
    const html = render([row(1, { name: 'Wykład wiosenny' })])
    expect(html).toContain('Wykład wiosenny')
    expect(html).toContain('zmieniono 2031-03-04 09:05')
    expect(html).toContain('Otwórz</button>')
    expect(html).toContain('aria-label="Zmień nazwę"')
    expect(html).toContain('Udostępnij zespołowi')
    expect(html).toContain('Usuń</button>')
    expect(html).not.toContain('Otwórz kopię')
    expect(html).not.toContain('Udostępnił(a)')
    // Pusta jest tylko sekcja cudzych projektów.
    expect(html).not.toContain('Nie masz jeszcze zapisanych projektów.')
    expect(html).toContain('Nikt jeszcze nie udostępnił')
  })

  it('przełącznik udostępniania mówi, jaki jest stan', () => {
    const shared = render([row(1, { shared: true })])
    expect(shared).toContain('aria-pressed="true"')
    expect(shared).toContain('Udostępniony zespołowi')
    const priv = render([row(1, { shared: false })])
    expect(priv).toContain('aria-pressed="false"')
    expect(priv).toContain('Udostępnij zespołowi')
  })

  it('usuwanie idzie przez ConfirmButton, nie przez window.confirm', () => {
    const html = render([row(1)])
    expect(html).not.toContain('role="group"')
    expect(readFileSync(new URL('./ProjectsList.tsx', import.meta.url), 'utf8')).not.toContain('window.confirm')
  })

  it('miniatura własnego projektu otwiera go', () => {
    const html = render([row(1, { name: 'Wykład wiosenny' })])
    expect(html).toContain('aria-label="Otwórz: Wykład wiosenny"')
  })

  it('cudzy projekt w drugiej sekcji: autor i tylko „Otwórz kopię"', () => {
    const html = render([row(2, { owner: 'other', owner_email: 'ona@klub.pl', shared: true })])
    expect(html).toContain('Udostępnił(a): ona@klub.pl')
    expect(html).toContain('Otwórz kopię')
    expect(html).not.toContain('Otwórz</button>')
    expect(html).not.toContain('Zmień nazwę')
    expect(html).not.toContain('Udostępnij zespołowi')
    expect(html).not.toContain('Usuń')
    expect(html).toContain('Nie masz jeszcze zapisanych projektów.')
  })

  it('własne i cudze trafiają do właściwych sekcji', () => {
    const html = render([row(1, { name: 'Moje A' }), row(2, { name: 'Cudze B', owner: 'other', owner_email: 'x@klub.pl' })])
    const split = html.indexOf('Udostępnione przez zespół')
    expect(html.indexOf('Moje A')).toBeLessThan(split)
    expect(html.indexOf('Cudze B')).toBeGreaterThan(split)
  })

  it('otwarty projekt: plakietka i aria-current tylko na nim', () => {
    const html = render([row(1), row(2)], 2)
    expect(html.match(/aria-current/g)).toHaveLength(1)
    expect(html.match(/Otwarty/g)).toHaveLength(1)
    expect(render([row(1)])).not.toContain('Otwarty')
  })

  it('nieczytelny snapshot: szara miniatura, notka, brak otwarcia (miniatury też), ale usuwanie zostaje', () => {
    const html = render([row(3, { snapshot: { v: 99 } })])
    expect(html).toContain('bg-border')
    expect(html).toContain('Wymaga nowszej wersji aplikacji')
    expect(html).not.toContain('Otwórz')
    expect(html).toContain('Usuń</button>')
  })

  it('cudzy nieczytelny snapshot: bez żadnej akcji', () => {
    const html = render([row(4, { owner: 'other', snapshot: null })])
    expect(html).toContain('Wymaga nowszej wersji aplikacji')
    expect(html).not.toContain('<button')
  })
})
