import { createElement } from 'react'
import type { ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SaveStatus } from '../workspace/syncState'
import { ProjectBar } from './ProjectBar'

const noop = () => {}
const render = (patch: Partial<ComponentProps<typeof ProjectBar>> = {}) =>
  renderToStaticMarkup(
    createElement(ProjectBar, {
      name: null, status: 'local', cloud: true, notice: null, missingCount: 0,
      onSave: noop, onNew: noop, onDismissNotice: noop, onRetryMissing: noop, onDropMissing: noop, onLoadCloud: noop, onOverwrite: noop,
      ...patch,
    }),
  )

describe('ProjectBar', () => {
  it('wersja robocza: nazwa zastępcza, „Zapisz" i „Nowy projekt"', () => {
    const html = render()
    expect(html).toContain('Wersja robocza')
    expect(html).toContain('Zapisana tylko na tym urządzeniu')
    expect(html).toContain('>Zapisz<')
    expect(html).toContain('>Nowy projekt<')
    expect(html).not.toContain('role="alert"')
  })

  it('otwarty projekt pokazuje nazwę i stan zapisu', () => {
    const html = render({ name: 'Wykład o AI', status: 'saved' })
    expect(html).toContain('Wykład o AI')
    expect(html).toContain('Zapisano')
    expect(html).not.toContain('Wersja robocza')
  })

  it('bez chmury nie ma „Zapisz", zostaje „Nowy projekt"', () => {
    const html = render({ cloud: false })
    expect(html).not.toContain('>Zapisz<')
    expect(html).toContain('Zapisywana na tym urządzeniu')
    expect(html).toContain('>Nowy projekt<')
  })

  it('w trakcie zapisu przycisk jest wyłączony', () => {
    expect(render({ name: 'P', status: 'saving' })).toMatch(/<button[^>]*disabled=""[^>]*>Zapisz</)
    expect(render({ name: 'P', status: 'dirty' })).not.toMatch(/<button[^>]*disabled=""[^>]*>Zapisz</)
  })

  it('konflikt: dwa wyjścia zamiast „Zapisz"', () => {
    const html = render({ name: 'P', status: 'conflict' })
    expect(html).toContain('Wczytaj wersję z chmury')
    expect(html).toContain('>Nadpisz<')
    expect(html).not.toContain('>Zapisz<')
    expect(render({ name: 'P', status: 'dirty' })).not.toContain('Nadpisz')
  })

  it('komunikat kopii roboczej jest ogłaszany i da się go zamknąć', () => {
    const html = render({ notice: 'Odśwież stronę — projekt wymaga nowszej wersji aplikacji' })
    expect(html).toMatch(/role="alert"[^>]*><span>Odśwież stronę — projekt wymaga nowszej wersji aplikacji</)
    expect(html).toContain('>Zamknij<')
  })

  it('niewczytane grafiki: liczba, ponowienie i świadome usunięcie', () => {
    const one = render({ missingCount: 1 })
    expect(one).toContain('Nie udało się wczytać 1 grafiki.')
    expect(one).toContain('Spróbuj ponownie')
    expect(one).toContain('Usuń je z projektu')
    expect(render({ missingCount: 3 })).toContain('Nie udało się wczytać 3 grafik.')
    expect(render()).not.toContain('Nie udało się wczytać')
  })
})

describe('opis stanu zapisu', () => {
  it('każdy status ma własny, niepusty opis', () => {
    const statuses: SaveStatus[] = ['local', 'saved', 'dirty', 'saving', 'error', 'conflict', 'paused']
    const labels = statuses.map((status) => render({ name: 'P', status }).match(/role="status">([^<]*)</)?.[1] ?? '')
    expect(labels.every((label) => label.length > 0)).toBe(true)
    expect(new Set(labels).size).toBe(statuses.length)
  })
})
