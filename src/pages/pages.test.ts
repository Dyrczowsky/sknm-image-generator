import { describe, expect, it } from 'vitest'
import type { AssetLibrary } from '../assets/useAssetLibrary'
import type { Notes } from '../notes/useNotes'
import type { ProjectRow } from '../projects/remoteProjects'
import type { Projects } from '../projects/useProjects'
import { h, render } from '../components/ui/testUtils'
import type { HistoryEntry } from '../types'
import { AssetsPage } from './AssetsPage'
import { HistoryPage } from './HistoryPage'
import { NotesPage } from './NotesPage'
import { ProjectsPage } from './ProjectsPage'

const noop = () => {}
// Lista jest nieaktywna (`idle`), dopóki nikt nie jest zalogowany.
const list = (items: unknown[], sessionStatus: string) => ({ status: sessionStatus === 'signedIn' ? 'ready' : 'idle', items, actionError: null, reload: noop })

const PROJECT: ProjectRow = {
  id: 7, created_at: '2031-03-04T10:00:00Z', updated_at: '2031-03-05T10:00:00Z', owner: 'u-ola', owner_email: 'ola@sknm.pl',
  name: 'Wykład o AI', shared: false, revision: 1, snapshot: { v: 1, poster_key: 'wyklad', form: { title: 'AI' } },
} as ProjectRow
const ENTRY: HistoryEntry = {
  id: 1, created_at: '2031-03-04T10:00:00Z', poster_key: 'wyklad', title: 'Mój wykład', subtitle: '', speaker: '',
  event_date: '2031-03-10', event_time: '17:30', location: 'sala 1', color_scheme: null, snapshot: null,
} as HistoryEntry

const projects = (sessionStatus: string, items: ProjectRow[] = [PROJECT]) =>
  render(h(ProjectsPage, {
    sessionStatus, projects: list(items, sessionStatus) as unknown as Projects, userId: 'u-ola', currentId: 7, lang: 'pl',
    onSignInClick: noop, onOpen: noop, onRename: noop, onShare: noop, onDelete: noop, onNew: noop,
  }))
const history = (sessionStatus: string) =>
  render(h(HistoryPage, { sessionStatus, history: { ...list([ENTRY], sessionStatus), record: noop, remove: noop }, lang: 'pl', onSignInClick: noop, onRestore: noop }))
const notes = (sessionStatus: string) =>
  render(h(NotesPage, {
    sessionStatus, onSignInClick: noop,
    notes: { ...list([{ id: 1, created_at: '2031-03-04T10:00:00Z', author_email: 'ola@sknm.pl', text: 'Wydrukować plakaty', done: false }], sessionStatus), add: noop, change: noop, remove: noop } as unknown as Notes,
  }))
const assets = (sessionStatus: string, items: unknown[] = [{ ref: 'a'.repeat(64) + '.png', created_at: '2031-03-04T10:00:00Z', author_email: 'jan@sknm.pl', kind: 'logo', name: 'Logo wydziału' }]) =>
  render(h(AssetsPage, { sessionStatus, onSignInClick: noop, library: { ...list(items, sessionStatus), rename: noop, remove: noop, register: noop, loadThumbs: async () => {} } as unknown as AssetLibrary }))

const PAGES: [string, (sessionStatus: string) => string, string][] = [
  ['Projekty', projects, 'swoje projekty'],
  ['Grafiki', assets, 'wspólną bibliotekę grafik'],
  ['Historia', history, 'wspólną historię plakatów'],
  ['Notatki', notes, 'wspólne notatki'],
]

describe('strony poboczne', () => {
  it('każda ma ramę strony: region nazwany nagłówkiem h1', () => {
    for (const [title, page] of PAGES) {
      const html = page('signedIn')
      const id = new RegExp(`<h1 id="([^"]+)"[^>]*>${title}</h1>`).exec(html)?.[1]
      expect(id, title).toBeTruthy()
      expect(html, title).toContain(`<section aria-labelledby="${id}"`)
    }
  })

  it('niezalogowany widzi zachętę do logowania zamiast listy', () => {
    for (const [title, page, subject] of PAGES) {
      const html = page('signedOut')
      expect(html, title).toMatch(/<button[^>]*>Zaloguj się<\/button>/)
      expect(html, title).toContain(subject)
      expect(html, title).not.toContain('<ul')
    }
  })

  it('w trakcie odczytu sesji pokazują ładowanie', () => {
    for (const [title, page] of PAGES) expect(page('loading'), title).toContain('Ładowanie…')
  })
})

describe('ProjectsPage', () => {
  it('lista projektów z otwartym zaznaczonym i akcją „Nowy projekt" w nagłówku strony', () => {
    const html = projects('signedIn')
    expect(html).toContain('Wykład o AI')
    expect(html).toContain('aria-current="true"')
    expect(html).toContain('Otwórz')
    expect(html.indexOf('>Nowy projekt<')).toBeLessThan(html.indexOf('<ul'))
  })

  it('pusta lista ma własny komunikat', () => {
    expect(projects('signedIn', [])).toContain('Nie masz jeszcze zapisanych projektów.')
  })
})

describe('HistoryPage', () => {
  it('wpisy z „Przywróć" i „Usuń"', () => {
    const html = history('signedIn')
    expect(html).toContain('Mój wykład')
    expect(html).toContain('Przywróć')
    expect(html).toContain('Usuń')
  })
})

describe('NotesPage', () => {
  it('pole nowej notatki i lista', () => {
    const html = notes('signedIn')
    expect(html).toContain('aria-label="Nowa notatka"')
    expect(html).toContain('Wydrukować plakaty')
  })
})

describe('AssetsPage', () => {
  it('pozycja biblioteki: nazwa, rodzaj, autor i data', () => {
    const html = assets('signedIn')
    expect(html).toContain('Logo wydziału')
    expect(html).toContain('Logotyp')
    expect(html).toContain('jan@sknm.pl')
    expect(html).toMatch(/2031-03-04 \d\d:00/)
  })

  it('grafika bez nazwy i pusta biblioteka', () => {
    expect(assets('signedIn', [{ ref: 'b'.repeat(64) + '.jpg', created_at: '2031-03-04T10:00:00Z', author_email: 'jan@sknm.pl', kind: 'photo', name: '' }])).toMatch(/Bez nazwy.*Zdjęcie/s)
    expect(assets('signedIn', [])).toContain('Biblioteka jest pusta.')
  })
})
