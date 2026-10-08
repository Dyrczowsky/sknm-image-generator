import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Editor } from '../editor/useEditor'
import type { PosterExport } from '../editor/usePosterExport'
import { ContentPanel, LookPanel } from '../forms/EditorPanels'
import { formatSummary } from '../posters/formats'
import { posterRegistry } from '../posters/registry'
import type { Medium, PosterLang } from '../types'
import type { EditorTab } from '../utils/uiState'
import { EditorTabs } from '../components/EditorTabs'
import { DownloadButton } from '../components/ExportBar'
import { PreviewPane } from '../components/PreviewPane'
import { ProjectBar } from '../components/ProjectBar'
import type { ProjectBarProps } from '../components/ProjectBar'
import { SchemeSelector } from '../components/SchemeSelector'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { NARROW_OFFSCREEN, NARROW_QUERY } from '../components/styles'
import { TemplateSelector } from '../components/TemplateSelector'
import { useMediaQuery } from '../utils/useMediaQuery'

// Widok edytora poniżej 900 px: formularz albo podgląd (oba stale w drzewie).
type NarrowView = 'edit' | 'preview'

const VIEW_OPTIONS = [
  { value: 'edit', label: 'Edycja' },
  { value: 'preview', label: 'Podgląd' },
] as const

// Poniżej 900 px widać jeden z dwóch paneli; drugi jest schowany, nigdy
// odmontowany. Zakładkom wystarcza `display: none`; podgląd musi zostać
// w układzie (`NARROW_OFFSCREEN` + `inert`), żeby „Pobierz" z dolnego paska
// dawało ten sam plik co przy widocznym podglądzie.
const NARROW_HIDDEN = 'max-[900px]:hidden'

// Od 900 px: dwie kolumny (zakładki | podgląd), każda na pełną wysokość.
const PANES_SIDE_BY_SIDE = 'min-[900px]:grid min-[900px]:grid-cols-[clamp(340px,38%,480px)_minmax(0,1fr)] min-[900px]:grid-rows-[minmax(0,1fr)]'
// Baner jest szeroki i niski: podgląd idzie na górę (stała część wysokości
// okna), a zakładki przewijają się pod nim - podgląd zostaje w zasięgu wzroku.
const BANNER_PREVIEW = 'min-[900px]:h-[40dvh] min-[900px]:min-h-64 min-[900px]:flex-none min-[900px]:border-b min-[900px]:border-border'

interface EditorPageProps {
  editor: Editor
  exporter: PosterExport
  lang: PosterLang
  // Węzeł plakatu w pełnej rozdzielczości - źródło eksportu (patrz `App`).
  posterRef: RefObject<HTMLDivElement | null>
  // Aktywna zakładka lewego panelu; pamięta ją `App` (localStorage, skróty Alt+1/2/3).
  tab: EditorTab
  onTabChange: (tab: EditorTab) => void
  onDownload: () => void
  // Wszystko, czego potrzebuje pasek projektu, poza akcją „Pobierz".
  project: Omit<ProjectBarProps, 'action'>
}

// Strona edytora: pasek projektu, a pod nim dwa panele - zakładki
// (Szablon / Treść / Wygląd) i podgląd z ustawieniami eksportu. Od 900 px
// wypełnia okno i przewija się wyłącznie treść zakładki; węziej widać jeden
// panel naraz („Edycja | Podgląd"), a „Pobierz" siedzi w przyklejonym dolnym pasku.
export function EditorPage({ editor, exporter, lang, posterRef, tab, onTabChange, onDownload, project }: EditorPageProps) {
  const [view, setView] = useState<NarrowView>('edit')
  const narrow = useMediaQuery(NARROW_QUERY)
  const { form, template, colors } = editor
  const poster = template ? posterRegistry[template.poster_key] : undefined
  const banner = exporter.medium === 'banner'

  // Zmiana rodzaju grafiki zamienia panele miejscami w DOM (kolejność Tab ma
  // iść za kolejnością na ekranie), a przeniesiony węzeł gubi fokus -
  // oddajemy go przełącznikowi, którym użytkownik właśnie zmienił rodzaj.
  const focusBeforeSwap = useRef<Element | null>(null)
  const selectMedium = (medium: Medium) => {
    // Kliknięcie aktywnego rodzaju nic nie zmienia - nie zostawiamy celu, który
    // przy późniejszej, niezwiązanej zmianie (np. otwarciu banera) ukradłby fokus.
    if (medium !== exporter.medium) focusBeforeSwap.current = document.activeElement
    exporter.selectMedium(medium)
  }
  useLayoutEffect(() => {
    const element = focusBeforeSwap.current
    focusBeforeSwap.current = null
    if (element instanceof HTMLElement && element.isConnected && document.activeElement !== element) element.focus({ preventScroll: true })
  }, [banner])

  const tabs = (
    <EditorTabs
      key="tabs"
      value={tab}
      onChange={onTabChange}
      wide={banner}
      className={`min-[900px]:min-h-0 ${banner ? 'min-[900px]:flex-1' : 'min-[900px]:border-r min-[900px]:border-border'} ${view === 'preview' ? NARROW_HIDDEN : ''}`}
      template={
        <div className="flex flex-col gap-5">
          <TemplateSelector
            templates={editor.templates}
            selectedId={template?.id ?? null}
            onSelect={editor.selectTemplate}
            medium={exporter.medium}
            onMediumChange={selectMedium}
            bannerShape={exporter.shape}
            lang={lang}
          />
          <SchemeSelector
            poster={poster}
            posterKey={template?.poster_key}
            selectedScheme={colors.scheme}
            onSelectScheme={editor.selectScheme}
            selectedAccent={colors.accent}
            onSelectAccent={editor.selectAccent}
            lang={lang}
          />
        </div>
      }
      content={<ContentPanel poster={poster} banner={banner} value={form} onChange={editor.updateForm} />}
      look={<LookPanel poster={poster} banner={banner} value={form} onChange={editor.updateForm} />}
    />
  )

  const preview = (
    <PreviewPane
      key="preview"
      posterRef={posterRef}
      Component={banner ? poster?.Banner : poster?.Component}
      data={form}
      scheme={colors.scheme}
      accent={colors.accent}
      lang={lang}
      exporter={exporter}
      inert={narrow && view === 'edit'}
      className={`${banner ? BANNER_PREVIEW : 'min-[900px]:min-h-0'} ${view === 'edit' ? NARROW_OFFSCREEN : ''}`}
    />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-medium={exporter.medium}>
      <h1 className="sr-only">Edytor plakatu</h1>
      <ProjectBar {...project} action={<DownloadButton exporter={exporter} onDownload={onDownload} className={NARROW_HIDDEN} />} />

      <div className="sticky top-0 z-10 flex-none border-b border-border bg-bg px-4 py-2 min-[900px]:hidden">
        <SegmentedToggle value={view} onChange={setView} options={VIEW_OPTIONS} ariaLabel="Widok edytora" fill />
      </div>

      {/* Kolejność w DOM = kolejność na ekranie: zwykle zakładki, potem
          podgląd; w banerze podgląd jest na górze. Klucze są stałe, więc React
          przenosi panele zamiast je odmontowywać. */}
      <div className={`flex min-h-0 flex-1 flex-col ${banner ? '' : PANES_SIDE_BY_SIDE}`}>{banner ? [preview, tabs] : [tabs, preview]}</div>

      <div className="sticky bottom-0 z-10 flex flex-none items-center gap-3 border-t border-border bg-surface px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-[900px]:hidden">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-0.5 rounded-lg border-0 bg-transparent py-1 text-left leading-tight"
          onClick={() => setView('preview')}
        >
          <span className="text-[0.75rem] font-semibold text-muted">Format</span>
          <span className="w-full truncate text-[0.8125rem] font-semibold text-fg">{formatSummary(exporter.format, exporter.orientation, exporter.fileType)}</span>
        </button>
        <DownloadButton exporter={exporter} onDownload={onDownload} />
      </div>
    </div>
  )
}
