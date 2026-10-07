import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import type { Editor } from '../editor/useEditor'
import { usePosterExport } from '../editor/usePosterExport'
import { formatsFor } from '../posters/formats'
import { h, openingTag, render } from '../components/ui/testUtils'
import type { EditorTab } from '../utils/uiState'
import { EditorPage } from './EditorPage'

const noop = () => {}
const TEMPLATES = [
  { id: 1, name: 'Wykład', poster_key: 'wyklad' },
  { id: 2, name: 'Gość', poster_key: 'gosc' },
]
const editor = {
  ready: true, templates: TEMPLATES, template: TEMPLATES[0], form: { ...EMPTY_FORM, title: 'Tytuł z formularza' }, updateForm: noop,
  colors: { scheme: undefined, accent: undefined }, colorScheme: null, selectTemplate: noop, selectScheme: noop, selectAccent: noop, applyState: noop,
} as unknown as Editor
const project = {
  name: null, status: 'local', cloud: true, notice: null, missingCount: 0,
  onSave: noop, onNew: noop, onDismissNotice: noop, onRetryMissing: noop, onDropMissing: noop, onLoadCloud: noop, onOverwrite: noop,
}
const BANNER = { medium: 'banner', format: 'fbCover', shape: 'cover', isPrint: false, formats: formatsFor('banner') }
const A4_PDF = { format: 'a4', isPrint: true, shape: 'portrait', orientation: 'portrait', fileType: 'pdf' }

// `usePosterExport` to hook, więc strona jest renderowana przez komponent pomocniczy.
function Harness({ tab = 'template', patch = {} }: { tab?: EditorTab; patch?: object }) {
  const exporter = { ...usePosterExport(), ...patch }
  return h(EditorPage, { editor, exporter, lang: 'pl', posterRef: createRef(), tab, onTabChange: noop, onDownload: noop, project })
}
const page = (props: object = {}) => render(h(Harness, props))

const section = (html: string, label: string) => {
  const from = html.indexOf(`<section aria-label="${label}"`)
  if (from === -1) throw new Error(`brak sekcji ${label}`)
  return from
}

describe('EditorPage', () => {
  it('ma nagłówek strony i trzy nazwane regiony: projekt, edycja, podgląd', () => {
    const html = page()
    expect(html).toMatch(/<h1[^>]*>Edytor plakatu<\/h1>/)
    expect(html).toMatch(/<section[^>]*aria-label="Projekt"/)
    expect(section(html, 'Edycja plakatu')).toBeGreaterThan(0)
    expect(section(html, 'Podgląd i eksport')).toBeGreaterThan(0)
  })

  it('pasek projektu niesie „Zapisz", „Nowy projekt" i główną akcję „Pobierz"', () => {
    const html = page()
    const strip = html.slice(html.indexOf('aria-label="Projekt"'), section(html, 'Edycja plakatu'))
    expect(strip).toContain('Wersja robocza')
    expect(strip).toContain('>Zapisz<')
    expect(strip).toContain('>Nowy projekt<')
    expect(strip).toMatch(/Pobierz <!-- -->PNG|Pobierz PNG/)
  })

  it('„Pobierz" jest jedyną akcją primary: w pasku projektu (od 900 px) i w dolnym pasku (węziej)', () => {
    const html = page()
    const primary = [...html.matchAll(/<button[^>]*class="([^"]* bg-accent [^"]*)"[^>]*>/g)].map((m) => m[1])
    expect(primary).toHaveLength(2)
    expect(primary.filter((cls) => cls.includes('max-[899px]:hidden'))).toHaveLength(1)
    const bottomBar = html.slice(html.lastIndexOf('sticky bottom-0'))
    expect(openingTag(html, '<div class="sticky bottom-0')).toContain('min-[900px]:hidden')
    expect(bottomBar).toContain('Kwadrat · 1080×1080')
    expect(bottomBar).toMatch(/Pobierz/)
  })

  it('zakładki Szablon / Treść / Wygląd: wszystkie panele w drzewie, nieaktywne z `hidden`', () => {
    const html = page({ tab: 'content' })
    expect(openingTag(html, '<div role="tablist"')).toContain('aria-label="Sekcje edytora"')
    const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*aria-selected="(true|false)"[^>]*>.*?<span[^>]*>([^<]+)<\/span>/g)].map((m) => `${m[2]}:${m[1]}`)
    expect(tabs).toEqual(['Szablon:false', 'Treść:true', 'Wygląd:false'])
    const panels = [...html.matchAll(/<div role="tabpanel"[^>]*>/g)].map((m) => / hidden=""/.test(m[0]))
    expect(panels).toEqual([true, false, true])
    // Treść ukrytych zakładek nie jest odmontowana: szablony i formularz są w drzewie.
    expect(html).toContain('aria-label="Rodzaj grafiki"')
    expect(html).toContain('Kolorystyka')
    expect(html).toContain('value="Tytuł z formularza"')
  })

  it('zakładka „Szablon": rodzaj grafiki, kafelki szablonów z aria-pressed i nazwą bez tekstu miniatury', () => {
    const html = page()
    const tiles = [...html.matchAll(/<button type="button" class="[^"]*" aria-pressed="(true|false)" title="[^"]*"><span aria-hidden="true"/g)].map((m) => m[1])
    // Dwa szablony + kolorystyki wybranego layoutu.
    expect(tiles.slice(0, 2)).toEqual(['true', 'false'])
    expect(html).toMatch(/<span class="[^"]*truncate[^"]*">Wykład<\/span><\/button>/)
    expect(html).toMatch(/<span class="[^"]*truncate[^"]*">Gość<\/span><\/button>/)
  })

  it('podgląd jest w drzewie zawsze - w widoku „Edycja" na telefonie tylko wysunięty poza okno, nigdy display:none', () => {
    const html = page()
    const preview = openingTag(html, '<section aria-label="Podgląd i eksport"')
    expect(preview).toContain('max-[899px]:left-[-200vw]')
    expect(preview).toContain('max-[899px]:fixed')
    expect(preview).not.toMatch(/class="[^"]*\b(max-\[899px\]:hidden|hidden|invisible)\b/)
    expect(preview).not.toContain(' hidden=""')
    // Węzeł plakatu w pełnej rozdzielczości (źródło eksportu) i tytuł z formularza.
    const body = html.slice(section(html, 'Podgląd i eksport'))
    expect(body).toContain('width:1080px;height:1080px')
    expect(body).toContain('Tytuł z formularza')
  })

  it('przełącznik „Edycja | Podgląd" jest tylko poniżej 900 px, a zakładki chowają się przez CSS dopiero w widoku podglądu', () => {
    const html = page()
    const toggle = html.slice(0, html.indexOf('aria-label="Widok edytora"'))
    expect(toggle.slice(toggle.lastIndexOf('<div class="sticky'))).toContain('min-[900px]:hidden')
    expect(html).toMatch(/aria-pressed="true"[^>]*>Edycja</)
    expect(html).toMatch(/aria-pressed="false"[^>]*>Podgląd</)
    expect(openingTag(html, '<section aria-label="Edycja plakatu"')).not.toContain('max-[899px]:hidden')
  })

  it('ustawienia eksportu stoją w panelu podglądu, nad plakatem', () => {
    const html = page({ patch: A4_PDF })
    const preview = section(html, 'Podgląd i eksport')
    const body = html.slice(preview)
    const format = body.indexOf('aria-label="Format eksportu"')
    expect(format).toBeGreaterThan(0)
    expect(body.indexOf('aria-label="Orientacja"')).toBeGreaterThan(format)
    expect(body.indexOf('aria-label="Typ pliku"')).toBeGreaterThan(format)
    expect(body.indexOf('width:1080px;height:1528px')).toBeGreaterThan(body.indexOf('aria-label="Typ pliku"'))
    expect(html).toMatch(/Pobierz <!-- -->PDF|Pobierz PDF/)
    expect(html).toContain('A4 · pion · PDF')
    // Format bez papieru nie ma orientacji ani typu pliku.
    expect(page()).not.toContain('aria-label="Orientacja"')
  })

  it('kolejność w DOM idzie za układem: plakat - zakładki przed podglądem, baner - podgląd przed zakładkami', () => {
    const poster = page()
    expect(section(poster, 'Edycja plakatu')).toBeLessThan(section(poster, 'Podgląd i eksport'))
    expect(poster).toContain('data-medium="social"')

    const banner = page({ patch: BANNER })
    expect(section(banner, 'Podgląd i eksport')).toBeLessThan(section(banner, 'Edycja plakatu'))
    expect(banner).toContain('data-medium="banner"')
    // Baner: podgląd jest górnym wierszem o ograniczonej wysokości, a nie kolumną.
    expect(openingTag(banner, '<section aria-label="Podgląd i eksport"')).toContain('min-[900px]:h-[40dvh]')
    expect(banner).not.toContain('min-[900px]:grid-cols-')
    expect(banner).toContain('width:1640px;height:624px')
  })
})
