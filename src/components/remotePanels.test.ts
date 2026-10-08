import { createElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Note } from '../notes/remoteNotes'
import type { Notes } from '../notes/useNotes'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import type { EditorSnapshot } from '../snapshot/snapshot'
import type { HistoryEntry } from '../types'
import { HistoryList } from './HistoryList'
import { NotesPanel } from './NotesPanel'
import { RemotePanel } from './RemotePanel'
import { ConfirmButton } from './ui'

// Dzieci jako argumenty: typy Reacta wymagają `children` w propsach, a linter
// zabrania przekazywać je tamtędy.
const h = createElement as unknown as (type: unknown, props: object | null, ...children: unknown[]) => ReactElement
const noop = () => {}

const panel = (sessionStatus: string, listStatus: string, actionError: string | null = null) =>
  renderToStaticMarkup(
    h(RemotePanel, { sessionStatus, listStatus, subject: 'wspólne notatki', onSignInClick: noop, onRetry: noop, actionError }, 'TREŚĆ_PANELU'),
  )

describe('RemotePanel', () => {
  it('niezalogowany: zaproszenie z przyciskiem logowania zamiast treści', () => {
    const html = panel('signedOut', 'idle')
    expect(html).toContain('Tylko dla członków koła')
    expect(html).toContain('Zaloguj się, aby zobaczyć wspólne notatki.')
    expect(html).toMatch(/<button[^>]*>(<svg.*?<\/svg>)?Zaloguj się<\/button>/)
    expect(html).not.toContain('TREŚĆ_PANELU')
    expect(html).not.toContain('text-accent ')
  })

  it('ładowanie (także zanim znamy sesję): status ze spinnerem', () => {
    for (const html of [panel('loading', 'idle'), panel('signedIn', 'loading')]) {
      expect(html).toContain('Ładowanie…')
      expect(html).toContain('role="status"')
    }
  })

  it('błąd wczytania: alert z przyciskiem ponowienia', () => {
    const html = panel('signedIn', 'error')
    expect(html).toContain('role="alert"')
    expect(html).toContain('Nie udało się wczytać danych')
    expect(html).toContain('Spróbuj ponownie')
    expect(html).not.toContain('TREŚĆ_PANELU')
  })

  it('build bez Supabase: wyjaśnienie zamiast wiecznego ładowania', () => {
    const html = panel('unconfigured', 'idle')
    expect(html).toContain('Brak połączenia z kontem zespołu')
    expect(html).not.toContain('Ładowanie…')
  })

  it('gotowe: treść, a nad nią błąd ostatniej zmiany', () => {
    expect(panel('signedIn', 'ready')).toBe('TREŚĆ_PANELU')
    const html = panel('signedIn', 'ready', 'Nie udało się zapisać zmiany.')
    expect(html).toContain('Nie udało się zapisać zmiany.')
    expect(html).toContain('role="alert"')
    expect(html.indexOf('Nie udało się zapisać')).toBeLessThan(html.indexOf('TREŚĆ_PANELU'))
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

  it('otwarte notatki są w „Do zrobienia", zrobione niżej w „Zrobione"', () => {
    const html = renderToStaticMarkup(
      h(NotesPanel, {
        notes: notes([
          { id: 2, created_at: '2031-03-03T10:00:00Z', author_email: 'jan@sknm.pl', text: 'Zrobiona rzecz', done: true },
          { id: 1, created_at: '2031-03-04T10:00:00Z', author_email: 'ola@sknm.pl', text: 'Otwarta rzecz', done: false },
        ]),
      }),
    )
    expect(html.indexOf('Do zrobienia')).toBeLessThan(html.indexOf('Otwarta rzecz'))
    expect(html.indexOf('Otwarta rzecz')).toBeLessThan(html.indexOf('Zrobione<'))
    expect(html.indexOf('Zrobione<')).toBeLessThan(html.indexOf('Zrobiona rzecz'))
  })

  it('same zrobione: sekcja „Do zrobienia" mówi, że wszystko gotowe', () => {
    const html = renderToStaticMarkup(
      h(NotesPanel, { notes: notes([{ id: 2, created_at: '2031-03-03T10:00:00Z', author_email: 'jan@sknm.pl', text: 'Zrobiona rzecz', done: true }]) }),
    )
    expect(html).toContain('Wszystko zrobione.')
  })

  it('pole dodawania: Dodaj wyłączone przy pustym tekście; edycja i usuwanie są przyciskami', () => {
    const html = renderToStaticMarkup(
      h(NotesPanel, { notes: notes([{ id: 1, created_at: '2031-03-04T10:00:00Z', author_email: 'ola@sknm.pl', text: 'Coś', done: false }]) }),
    )
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>(<svg.*?<\/svg>)?Dodaj<\/button>/)
    expect(html).toContain('Edytuj')
    expect(html).toContain('Usuń')
  })
})

describe('HistoryList', () => {
  const entry = (overrides: Partial<HistoryEntry>): HistoryEntry => ({
    id: 1, created_at: new Date(2031, 2, 4, 9, 5).toISOString(), poster_key: 'wyklad',
    title: 'Mój wykład', subtitle: '', speaker: '', event_date: '2031-03-10', event_time: '17:30', location: 'sala 1', color_scheme: 'czern~zloty', snapshot: null,
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

  const snapshot = (export_: Partial<EditorSnapshot['export']>): EditorSnapshot => ({
    v: 1, poster_key: 'wyklad', color_scheme: null, lang: 'pl', export: { ...DEFAULT_EXPORT_SETTINGS, ...export_ },
    form: { ...EMPTY_FORM, graphics: [], photos: {}, title: 'Mój wykład' },
  })

  it('wpis bez snapshotu: kwadratowa miniatura właściwego layoutu', () => {
    const html = render([entry({ snapshot: null })])
    expect(html).toContain('width:208px;height:208px')
    expect(html).toContain('Mój wykład')
    expect(html).not.toContain('bg-border')
  })

  it('snapshot z medium banner: miniatura banera', () => {
    const html = render([entry({ snapshot: snapshot({ medium: 'banner', format: 'fbCover' }) })])
    expect(html).toContain('width:208px;height:79')
    expect(html).toContain('width:1640px;height:624px')
  })

  it('snapshot A4 poziomo: ok. 208×147 px', () => {
    const html = render([entry({ snapshot: snapshot({ format: 'a4', orientation: 'landscape' }) })])
    expect(html).toContain('width:208px;height:147')
  })

  it('snapshot nieczytelny (nieznana wersja): wraca do wąskich kolumn', () => {
    const html = render([entry({ snapshot: { v: 99 } })])
    expect(html).toContain('width:208px;height:208px')
  })

  // Przechodzi po drzewie elementów, rozwijając komponenty bez hooków
  // (HistoryList, HistoryCard); ConfirmButton zostaje jako węzeł do sprawdzenia.
  const confirmButtons = (node: ReactNode): ReactElement<{ question: string; onConfirm: () => void }>[] => {
    if (Array.isArray(node)) return node.flatMap(confirmButtons)
    if (!isValidElement(node)) return []
    if (node.type === ConfirmButton) return [node as ReactElement<{ question: string; onConfirm: () => void }>]
    const props = node.props as { children?: ReactNode }
    if (typeof node.type === 'function') {
      // Tylko komponenty listy; reszta (miniatury) używa hooków i nic tu nie wnosi.
      return ['HistoryList', 'HistoryCard'].includes(node.type.name) ? confirmButtons((node.type as (p: object) => ReactNode)(node.props as object)) : []
    }
    return confirmButtons(props.children)
  }

  it('Usuń przechodzi przez potwierdzenie, które mówi o całym zespole', () => {
    const deleted: number[] = []
    const tree = HistoryList({ entries: [entry({ id: 5 })], onRestore: noop, onDelete: (id) => deleted.push(id), lang: 'pl' })
    const [confirm] = confirmButtons(tree)
    expect(confirm.props.question).toContain('całego zespołu')
    expect(deleted).toEqual([])
    confirm.props.onConfirm()
    expect(deleted).toEqual([5])
  })

  it('w spoczynku nie ma pytania; „Przywróć" jest zwykłym przyciskiem karty', () => {
    const html = render([entry({})])
    expect(html).not.toContain('role="group"')
    expect(html).toMatch(/<button[^>]*>(<svg.*?<\/svg>)?Przywróć<\/button>/)
    expect(html).toContain('aria-label="Przywróć: Mój wykład"')
  })

  it('wiersz daty, godziny i miejsca oraz brak pustego wiersza', () => {
    expect(render([entry({})])).toContain('2031-03-10 • 17:30 • sala 1')
    const html = render([entry({ event_date: '', event_time: '', location: '' })])
    expect(html).not.toContain('•')
  })
})
