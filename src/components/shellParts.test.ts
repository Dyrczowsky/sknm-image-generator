import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { usePosterExport } from '../editor/usePosterExport'
import { EMPTY_FORM } from '../editor/formState'
import { posterRegistry } from '../posters/registry'
import { SHAPE_SIZE } from '../posters/shape'
import type { Session } from '../supabase/useSession'
import type { PosterShape } from '../types'
import { AuthControl } from './AuthControl'
import { EditorTabs } from './EditorTabs'
import { DownloadButton, ExportBar } from './ExportBar'
import { PreviewPane } from './PreviewPane'
import { h, openingTag, render } from './ui/testUtils'

const noop = () => {}

describe('AuthControl', () => {
  const control = (session: object) => render(h(AuthControl, { session: session as Session, onSignInClick: noop, onSignOut: noop }))

  it('bez Supabase i w trakcie odczytu sesji nic nie rysuje', () => {
    expect(control({ status: 'unconfigured' })).toBe('')
    expect(control({ status: 'loading' })).toBe('')
  })

  it('wylogowany: przycisk „Zaloguj"', () => {
    expect(control({ status: 'signedOut' })).toMatch(/<button[^>]*>.*Zaloguj<\/button>/)
  })

  it('zalogowany: przycisk konta z adresem w nazwie, panel z „Wyloguj" dopiero po otwarciu', () => {
    const html = control({ status: 'signedIn', email: 'ola@sknm.pl' })
    const button = openingTag(html, '<button')
    expect(button).toContain('aria-label="Konto: ola@sknm.pl"')
    expect(button).toContain('aria-haspopup="dialog"')
    expect(button).toContain('aria-expanded="false"')
    expect(html).not.toContain('Wyloguj')
  })
})

describe('EditorTabs', () => {
  const tabs = (value: string) =>
    render(h(EditorTabs, { value, onChange: noop, template: 'TREŚĆ_SZABLONU', content: h('input', { name: 'tytul' }), look: 'TREŚĆ_WYGLĄDU' }))

  it('region „Edycja plakatu" z listą trzech zakładek', () => {
    const html = tabs('template')
    expect(html.startsWith('<section aria-label="Edycja plakatu"')).toBe(true)
    expect(html.match(/role="tab"/g)).toHaveLength(3)
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
  })

  it('każda zakładka wskazuje swój panel, a panel swoją zakładkę', () => {
    const html = tabs('look')
    const controls = [...html.matchAll(/role="tab" id="([^"]+)"[^>]*aria-controls="([^"]+)"/g)].map((m) => [m[1], m[2]])
    expect(controls).toHaveLength(3)
    for (const [tabId, panelId] of controls) expect(html).toContain(`role="tabpanel" id="${panelId}" aria-labelledby="${tabId}"`)
  })

  it('nieaktywne panele zostają w drzewie z `hidden` - pola formularza nie giną', () => {
    const html = tabs('template')
    expect(html).toContain('TREŚĆ_SZABLONU')
    expect(html).toContain('<input name="tytul"/>')
    expect(html).toContain('TREŚĆ_WYGLĄDU')
    expect(html.match(/role="tabpanel"[^>]* hidden=""/g)).toHaveLength(2)
  })
})

function Export({ patch = {}, part }: { patch?: object; part: 'bar' | 'button' | 'pane' }) {
  const exporter = { ...usePosterExport(), ...patch }
  if (part === 'bar') return h(ExportBar, { exporter })
  if (part === 'button') return h(DownloadButton, { exporter, onDownload: noop })
  return h(PreviewPane, { posterRef: createRef(), Component: posterRegistry.wyklad.Component, data: { ...EMPTY_FORM, title: 'Tytuł' }, lang: 'pl', exporter })
}
const exportPart = (part: 'bar' | 'button' | 'pane', patch: object = {}) => render(h(Export, { part, patch }))

describe('ExportBar', () => {
  it('grupa z nazwą; format to natywny select z formatami bieżącego rodzaju grafiki', () => {
    const html = exportPart('bar')
    expect(openingTag(html, '<div')).toContain('aria-label="Ustawienia eksportu"')
    expect(openingTag(html, '<select')).toContain('aria-label="Format eksportu"')
    expect(html.match(/<option/g)).toHaveLength(5)
    expect(html).not.toContain('aria-label="Orientacja"')
    expect(html).not.toContain('Pobierz')
  })

  it('format papierowy dokłada orientację i typ pliku', () => {
    const html = exportPart('bar', { format: 'a3', isPrint: true })
    expect(html).toContain('aria-label="Orientacja"')
    expect(html).toContain('aria-label="Typ pliku"')
  })
})

describe('DownloadButton', () => {
  it('akcja primary z typem pliku w podpisie', () => {
    const html = exportPart('button', { fileType: 'pdf' })
    expect(openingTag(html, '<button')).toContain('bg-accent')
    expect(html.replaceAll('<!-- -->', '')).toContain('Pobierz PDF')
  })

  it('w trakcie eksportu jest zajęty i mówi „Generowanie…"', () => {
    const html = exportPart('button', { exporting: true })
    expect(openingTag(html, '<button')).toContain('aria-busy="true"')
    expect(html).toContain('Generowanie…')
  })
})

describe('PreviewPane', () => {
  it('scena dostaje proporcje kształtu, a węzeł plakatu ma pełny rozmiar układu - dla każdego kształtu', () => {
    for (const shape of Object.keys(SHAPE_SIZE) as PosterShape[]) {
      const { width, height } = SHAPE_SIZE[shape]
      const html = exportPart('pane', { shape })
      expect(html, shape).toContain(`--preview-ratio:${width} / ${height}`)
      expect(html, shape).toContain(`width:${width}px;height:${height}px`)
    }
  })

  it('scena nie zależy od rozmiaru plakatu: plakat jest w niej pozycjonowany absolutnie, a nadmiar przycięty', () => {
    const html = exportPart('pane')
    const stage = openingTag(html, '<div style="--preview-ratio')
    expect(stage).toContain('relative')
    expect(stage).toContain('overflow-hidden')
    expect(html).toContain('<div class="absolute inset-0 flex items-center justify-center">')
  })

  it('komunikat eksportu jest ogłaszany jako status i leży na scenie (nie przesuwa podglądu)', () => {
    const html = exportPart('pane', { note: 'Zapisano w 150 dpi' })
    const note = openingTag(html, '<p role="status"')
    expect(note).toContain('absolute')
    expect(html).toContain('Zapisano w 150 dpi')
    expect(exportPart('pane')).not.toContain('role="status"')
  })

  it('`inert` trafia na cały panel', () => {
    expect(openingTag(exportPart('pane'), '<section')).not.toContain('inert')
    const html = render(h(PreviewPane, { posterRef: createRef(), data: EMPTY_FORM, lang: 'pl', inert: true, exporter: { shape: 'square', formats: [], format: 'square', isPrint: false, note: null } }))
    expect(openingTag(html, '<section')).toContain('inert=""')
  })
})
