import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Note } from '../notes/remoteNotes'
import type { Notes } from '../notes/useNotes'
import type { HistoryEntry } from '../types'
import { HistoryList } from './HistoryList'
import { NotesPanel } from './NotesPanel'
import { RemotePanel } from './RemotePanel'

// Dzieci jako argumenty: typy Reacta wymagają `children` w propsach, a linter
// zabrania przekazywać je tamtędy.
const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement
const noop = () => {}

const panel = (sessionStatus: string, listStatus: string, actionError: string | null = null) =>
  renderToStaticMarkup(
    h(RemotePanel, { sessionStatus, listStatus, subject: 'wspólne notatki', onSignInClick: noop, onRetry: noop, actionError }, 'TREŚĆ_PANELU'),
  )

describe('RemotePanel', () => {
  it('niezalogowany: zachęta do logowania zamiast treści', () => {
    const html = panel('signedOut', 'idle')
    expect(html).toContain('Zaloguj się')
    expect(html).toContain('wspólne notatki')
    expect(html).not.toContain('TREŚĆ_PANELU')
  })

  it('ładowanie (także zanim znamy sesję)', () => {
    expect(panel('loading', 'idle')).toContain('Ładowanie…')
    expect(panel('signedIn', 'loading')).toContain('Ładowanie…')
  })

  it('błąd wczytania: komunikat z ponowieniem', () => {
    const html = panel('signedIn', 'error')
    expect(html).toContain('Spróbuj ponownie')
    expect(html).not.toContain('TREŚĆ_PANELU')
  })

  it('gotowe: treść, a nad nią błąd ostatniej zmiany', () => {
    expect(panel('signedIn', 'ready')).toBe('TREŚĆ_PANELU')
    const html = panel('signedIn', 'ready', 'Nie udało się zapisać zmiany.')
    expect(html).toContain('Nie udało się zapisać zmiany.')
    expect(html).toContain('TREŚĆ_PANELU')
  })
})

describe('NotesPanel', () => {
  const notes = (items: Note[]) =>
    ({ status: 'ready', items, actionError: null, reload: noop, add: noop, change: noop, remove: noop }) as unknown as Notes

  it('pusta lista', () => {
    expect(renderToStaticMarkup(h(NotesPanel, { notes: notes([]) }))).toContain('Brak notatek.')
  })

  it('pozycja pokazuje treść, autora i stan zrobienia', () => {
    const html = renderToStaticMarkup(
      h(NotesPanel, {
        notes: notes([
          { id: 1, created_at: '2031-03-04T10:00:00Z', author_email: 'ola@sknm.pl', text: 'Wydrukować plakaty', done: false },
          { id: 2, created_at: '2031-03-03T10:00:00Z', author_email: 'jan@sknm.pl', text: 'Zarezerwować salę', done: true },
        ]),
      }),
    )
    expect(html).toContain('Wydrukować plakaty')
    expect(html).toContain('ola@sknm.pl')
    expect(html).toMatch(/line-through[^>]*>Zarezerwować salę/)
    expect(html.match(/type="checkbox"/g)).toHaveLength(2)
    expect(html.match(/checked=""/g)).toHaveLength(1)
  })
})

describe('HistoryList', () => {
  const entry = (overrides: Partial<HistoryEntry>): HistoryEntry => ({
    id: 1, created_at: new Date(2031, 2, 4, 9, 5).toISOString(), poster_key: 'wyklad',
    title: 'Mój wykład', subtitle: '', speaker: '', event_date: '2031-03-10', event_time: '17:30', location: 'sala 1', color_scheme: 'czern~zloty',
    ...overrides,
  })
  const render = (entries: HistoryEntry[]) => renderToStaticMarkup(h(HistoryList, { entries, onRestore: noop, onDelete: noop, lang: 'pl' }))

  it('pusta historia', () => {
    expect(render([])).toContain('Brak wygenerowanych obrazów.')
  })

  it('wpis: nazwa layoutu z rejestru, kolorystyka i lokalna data zapisu', () => {
    const html = render([entry({})])
    expect(html).toContain('Mój wykład')
    expect(html).toContain('Wykład · Czerń / Złoty (okazjonalny)')
    expect(html).toContain('2031-03-04 09:05')
    expect(html).toContain('Przywróć')
    expect(html).toContain('Usuń')
  })

  it('nieznany layout: surowy klucz i szara miniatura zamiast plakatu', () => {
    const html = render([entry({ poster_key: 'piknik', title: '', color_scheme: null })])
    expect(html).toContain('(bez tytułu)')
    expect(html).toContain('piknik')
    expect(html).toContain('bg-border')
  })
})
