import { useRef, useState } from 'react'
import type { HistoryEntry, PosterLang } from './types'
import { AssetLibraryContext } from './assets/AssetLibraryContext'
import { useAssetLibrary } from './assets/useAssetLibrary'
import { useEditor } from './editor/useEditor'
import { usePosterExport } from './editor/usePosterExport'
import { posterRegistry } from './posters/registry'
import { SCHEME_LABELS } from './posters/schemes'
import { SHAPE_SIZE } from './posters/shape'
import { FormBanner } from './forms/FormBanner'
import { newHistoryEntry } from './history/remoteHistory'
import { useHistory } from './history/useHistory'
import { useNotes } from './notes/useNotes'
import type { ProjectRow } from './projects/remoteProjects'
import { useProjects } from './projects/useProjects'
import { isMacPlatform } from './shortcuts/shortcuts'
import type { ShortcutId } from './shortcuts/shortcuts'
import { useShortcuts } from './shortcuts/useShortcuts'
import { parseSnapshot, snapshotFromLegacyHistory } from './snapshot/snapshot'
import { useSession } from './supabase/useSession'
import { AuthControl } from './components/AuthControl'
import { AuthDialog } from './components/AuthDialog'
import { CollapsiblePanel } from './components/CollapsiblePanel'
import { ExportBar } from './components/ExportBar'
import { FloatingReportButton } from './components/FloatingReportButton'
import { HistoryList } from './components/HistoryList'
import { LangToggle } from './components/LangToggle'
import { NotesPanel } from './components/NotesPanel'
import { PosterPreview } from './components/PosterPreview'
import { ProjectBar } from './components/ProjectBar'
import { ProjectsList } from './components/ProjectsList'
import { RemotePanel } from './components/RemotePanel'
import { SchemeSelector } from './components/SchemeSelector'
import { ShortcutsHelp } from './components/ShortcutsHelp'
import { SiteFooter } from './components/SiteFooter'
import { PAGE_SHELL } from './components/styles'
import { TemplateSelector } from './components/TemplateSelector'
import { TicketDialog } from './components/TicketDialog'
import type { TicketType } from './components/TicketDialog'
import { COLLAPSED_STORAGE_KEY, parseCollapsed } from './utils/collapsedPanels'
import type { PanelKey } from './utils/collapsedPanels'
import type { BugContextInput } from './utils/issueUrl'
import { useElementWidth } from './utils/useElementWidth'
import { useStoredState } from './utils/useStoredState'
import { useWorkspace } from './workspace/useWorkspace'

const LANG_STORAGE_KEY = 'sknm-poster-lang'
const LANG_STORAGE = {
  parse: (raw: string | null): PosterLang => (raw === 'en' ? 'en' : 'pl'),
  serialize: (lang: PosterLang) => lang,
}
const COLLAPSED_STORAGE = { parse: parseCollapsed, serialize: JSON.stringify }
const KNOWN_LAYOUTS = Object.keys(posterRegistry)

// Górne granice podglądu banera (px na ekranie): szerokość i wysokość -
// wyższy baner wydarzenia nie może wypchnąć kolorystyki poza okno.
const BANNER_PREVIEW_MAX_W = 1100
const BANNER_PREVIEW_MAX_H = 460

// Panel: karta sekcji. W jednej kolumnie (mobile) rozdzielona odstępem
// `mt-5`; od 900px grid ustawia odstępy przez `gap`, więc `mt` znika.
const PANEL = 'mt-5 rounded-[14px] border border-border bg-surface p-5 min-[900px]:mt-0'
const PANEL_HEADING = 'mb-3.5 text-base font-semibold uppercase tracking-[0.04em] text-muted'

// Do 900px sekcje płyną jedna pod drugą w kolejności DOM. Od 900px
// grid-template-areas robi dwie kolumny: lewa to szablon/formularz/akcje/
// projekty/historia/notatki, prawa to przypięty (sticky) podgląd. Nadmiar wysokości
// podglądu bierze ostatni wiersz (1fr) - inaczej zwinięte panele rozjeżdżałyby
// się, bo grid dzieli go równo między wiersze. Baner: podgląd idzie na górę,
// na całą szerokość. Bez Supabase paneli projektów, historii i notatek nie
// ma, więc siatka kończy się na akcjach.
const GRID = 'flex flex-col min-[900px]:mt-5 min-[900px]:grid min-[900px]:grid-cols-[1fr_460px] min-[900px]:items-start min-[900px]:gap-6'
const GRID_AREAS = {
  poster: {
    local: "min-[900px]:grid-rows-[auto_auto_1fr] min-[900px]:[grid-template-areas:'template_preview''form_preview''actions_preview']",
    shared: "min-[900px]:grid-rows-[auto_auto_auto_auto_auto_1fr] min-[900px]:[grid-template-areas:'template_preview''form_preview''actions_preview''projects_preview''history_preview''notes_preview']",
  },
  banner: {
    local: "min-[900px]:grid-rows-[auto_auto_auto_1fr] min-[900px]:[grid-template-areas:'preview_preview''template_template''form_form''actions_actions']",
    shared: "min-[900px]:grid-rows-[auto_auto_auto_auto_auto_auto_1fr] min-[900px]:[grid-template-areas:'preview_preview''template_template''form_form''actions_actions''projects_projects''history_history''notes_notes']",
  },
}

// Podgląd w pionie (A4/A3/A2) bywa wyższy niż okno - przypięty panel przewija
// się wtedy w sobie, żeby kolorystyka i akcent były osiągalne.
const PREVIEW_STICKY = 'min-[900px]:sticky min-[900px]:top-5 min-[900px]:max-h-[calc(100vh-2.5rem)] min-[900px]:overflow-y-auto'

function App() {
  const editor = useEditor()
  const exporter = usePosterExport()
  const session = useSession()
  // Dane wspólne są dostępne dla każdego z sesją, także w trakcie ustawiania hasła.
  const signedIn = session.status === 'signedIn' || session.status === 'settingPassword'
  const member = signedIn ? (session.email ?? '') : null
  const userId = signedIn ? session.userId : null
  const history = useHistory(member)
  const notes = useNotes(member)
  const projects = useProjects(userId)
  const library = useAssetLibrary(member)
  const [authOpen, setAuthOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const posterRef = useRef<HTMLDivElement | null>(null)
  const [lang, setLang] = useStoredState(LANG_STORAGE_KEY, LANG_STORAGE)
  const [collapsed, setCollapsed] = useStoredState(COLLAPSED_STORAGE_KEY, COLLAPSED_STORAGE)
  const [ticket, setTicket] = useState<TicketType | null>(null)
  const [previewBoxRef, previewBoxWidth] = useElementWidth<HTMLDivElement>()
  // Kopia robocza: zapis i odtwarzanie całego stanu (edytor + eksport + język).
  const workspace = useWorkspace({
    editor,
    exporter,
    lang,
    setLang,
    userId: session.status === 'loading' ? undefined : userId,
    onUploaded: library.register,
    onProjectSaved: projects.upsert,
  })

  const ready = editor.ready && workspace.ready
  const { form, template, colors } = editor
  // Bez Supabase aplikacja nie ma logowania ani paneli z danymi wspólnymi.
  const shared = session.status !== 'unconfigured'
  const openSignIn = () => setAuthOpen(true)

  // „Zapisz" (przycisk i skrót). Niezalogowanemu otwiera logowanie; bez
  // Supabase nie robi nic - skrót i tak blokuje okno zapisu przeglądarki.
  const handleSave = () => {
    if (!ready || !shared || session.status === 'loading') return
    if (!signedIn) {
      openSignIn()
      return
    }
    void workspace.saveNow().then((result) => {
      if (result === 'signedOut') openSignIn()
    })
  }

  // Plik zapisuje się zawsze; wpis do wspólnej historii (po wgraniu grafik)
  // tylko u zalogowanych, a jego porażka nie unieważnia pobranego pliku.
  const handleDownload = () => {
    const node = posterRef.current
    const snapshot = workspace.snapshot
    if (!ready || !template || !node) return
    const record =
      signedIn && snapshot
        ? async () => {
            await workspace.uploadAssets(snapshot)
            await history.record(newHistoryEntry(snapshot))
          }
        : undefined
    void exporter.download(node, form.title, record)
  }

  useShortcuts({ save: handleSave, export: handleDownload, help: () => setHelpOpen((open) => !open) })

  if (!ready) {
    return (
      <main className={PAGE_SHELL}>
        <p>Ładowanie...</p>
      </main>
    )
  }

  const poster = template ? posterRegistry[template.poster_key] : undefined
  const banner = exporter.medium === 'banner'
  const SelectedForm = poster?.Form

  // Baner jest szeroki i niski - jego podgląd idzie za szerokością panelu.
  const shapeSize = SHAPE_SIZE[exporter.shape]
  const bannerPreviewSize =
    previewBoxWidth > 0
      ? Math.min(previewBoxWidth, BANNER_PREVIEW_MAX_W, Math.round((BANNER_PREVIEW_MAX_H * shapeSize.width) / shapeSize.height))
      : undefined

  const togglePanel = (key: PanelKey) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  const openNotes = notes.items.filter((note) => !note.done).length
  // Rozwinięcie panelu odświeża listę - nie ma synchronizacji na żywo.
  const toggleNotes = () => {
    if (collapsed.notes && signedIn) notes.reload()
    togglePanel('notes')
  }
  const toggleProjects = () => {
    if (collapsed.projects && signedIn) projects.reload()
    togglePanel('projects')
  }

  const enabledShortcuts: ShortcutId[] = shared ? ['save', 'export', 'help'] : ['export', 'help']

  // Wpis historii otwiera się jako nowa, niezapisana praca - nigdy nie
  // nadpisuje otwartego projektu. Stary wpis (bez snapshotu) albo nieczytelny
  // wraca z wąskich kolumn; wpisu z nowszej wersji aplikacji nie otwieramy.
  const restoreHistory = (entry: HistoryEntry) => {
    const parsed = parseSnapshot(entry.snapshot, KNOWN_LAYOUTS)
    const legacy = !parsed.ok && parsed.reason === 'invalid'
    void workspace.open(legacy ? snapshotFromLegacyHistory(entry, lang) : entry.snapshot, null)
  }

  const renameProject = (row: ProjectRow, name: string) => {
    void projects.rename(row.id, name).then((ok) => {
      if (ok) workspace.renamed(row.id, name)
    })
  }

  // Usunięcie otwartego projektu zostawia jego treść jako wersję roboczą.
  const deleteProject = (row: ProjectRow) => {
    const open = row.id === workspace.project?.id
    void projects.remove(row.id).then((ok) => {
      if (ok && open) workspace.detach()
    })
  }

  const bugContext: BugContextInput = {
    templateName: template?.name,
    posterKey: template?.poster_key,
    schemeKey: editor.colorScheme,
    schemeLabel: colors.scheme ? SCHEME_LABELS[colors.scheme] : undefined,
    lang,
    form,
    appUrl: window.location.href,
    userAgent: navigator.userAgent,
    version: __APP_VERSION__,
  }

  return (
    <AssetLibraryContext value={signedIn ? library : null}>
      <main className={PAGE_SHELL}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[1.6rem] font-bold">Generator plakatów SKNM</h1>
          <div className="flex flex-wrap items-center gap-3">
            <AuthControl session={session} onSignInClick={openSignIn} onSignOut={() => void workspace.signOut(session.signOut)} />
            <LangToggle value={lang} onChange={setLang} />
            <ShortcutsHelp enabled={enabledShortcuts} isMac={isMacPlatform()} open={helpOpen} onOpenChange={setHelpOpen} />
          </div>
        </div>

        <ProjectBar
          name={workspace.project?.name ?? null}
          status={workspace.status}
          cloud={shared}
          notice={workspace.notice}
          missingCount={workspace.missingCount}
          onSave={handleSave}
          onNew={() => void workspace.newProject()}
          onDismissNotice={workspace.dismissNotice}
          onRetryMissing={() => void workspace.retryMissing()}
          onDropMissing={workspace.dropMissing}
          onLoadCloud={() => void workspace.loadCloudVersion()}
          onOverwrite={() => void workspace.overwriteCloudVersion()}
        />

        <div className={`${GRID} ${GRID_AREAS[banner ? 'banner' : 'poster'][shared ? 'shared' : 'local']}`}>
          <CollapsiblePanel
            id="template"
            title="1. Wybierz szablon"
            summary={template?.name}
            open={!collapsed.template}
            onToggle={() => togglePanel('template')}
            className={`${PANEL} min-[900px]:[grid-area:template]`}
          >
            <TemplateSelector
              templates={editor.templates}
              selectedId={template?.id ?? null}
              onSelect={editor.selectTemplate}
              medium={exporter.medium}
              onMediumChange={exporter.selectMedium}
              bannerShape={exporter.shape}
              lang={lang}
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            id="form"
            title="2. Uzupełnij dane"
            open={!collapsed.form}
            onToggle={() => togglePanel('form')}
            className={`${PANEL} min-[900px]:[grid-area:form]`}
          >
            {/* Baner ma wspólny, krótki formularz - dane wydarzenia zostają
                w stanie i wracają po przejściu na „Social media". */}
            {banner
              ? poster && <FormBanner value={form} onChange={editor.updateForm} photo={poster.bannerPhoto} />
              : SelectedForm && <SelectedForm value={form} onChange={editor.updateForm} />}
          </CollapsiblePanel>

          <ExportBar exporter={exporter} onDownload={handleDownload} className={`${PANEL} flex flex-wrap items-center gap-3 min-[900px]:[grid-area:actions]`} />

          <section className={`${PANEL} min-[900px]:[grid-area:preview] ${banner ? '' : PREVIEW_STICKY}`}>
            <h2 className={PANEL_HEADING}>Podgląd</h2>
            <div ref={previewBoxRef}>
              <PosterPreview
                posterRef={posterRef}
                Component={banner ? poster?.Banner : poster?.Component}
                data={form}
                scheme={colors.scheme}
                accent={colors.accent}
                lang={lang}
                shape={exporter.shape}
                size={banner ? bannerPreviewSize : undefined}
              />
            </div>
            <SchemeSelector
              poster={poster}
              posterKey={template?.poster_key}
              selectedScheme={colors.scheme}
              onSelectScheme={editor.selectScheme}
              selectedAccent={colors.accent}
              onSelectAccent={editor.selectAccent}
              lang={lang}
            />
          </section>

          {shared && (
            <>
              <CollapsiblePanel
                id="projects"
                title="Projekty"
                summary={workspace.project?.name}
                open={!collapsed.projects}
                onToggle={toggleProjects}
                className={`${PANEL} min-[900px]:[grid-area:projects]`}
              >
                <RemotePanel
                  sessionStatus={session.status}
                  listStatus={projects.status}
                  subject="swoje projekty"
                  onSignInClick={openSignIn}
                  onRetry={projects.reload}
                  actionError={projects.actionError}
                >
                  <ProjectsList
                    projects={projects.items}
                    userId={session.userId ?? ''}
                    currentId={workspace.project?.id ?? null}
                    lang={lang}
                    onOpen={(row) => void workspace.openProject(row)}
                    onRename={renameProject}
                    onShare={(row, isShared) => void projects.setShared(row.id, isShared)}
                    onDelete={deleteProject}
                  />
                </RemotePanel>
              </CollapsiblePanel>

              <CollapsiblePanel
                id="history"
                title="Historia"
                open={!collapsed.history}
                onToggle={() => togglePanel('history')}
                className={`${PANEL} min-[900px]:[grid-area:history]`}
              >
                <RemotePanel
                  sessionStatus={session.status}
                  listStatus={history.status}
                  subject="wspólną historię plakatów"
                  onSignInClick={openSignIn}
                  onRetry={history.reload}
                  actionError={history.actionError}
                >
                  <HistoryList entries={history.items} onRestore={restoreHistory} onDelete={(id) => void history.remove(id)} lang={lang} />
                </RemotePanel>
              </CollapsiblePanel>

              <CollapsiblePanel
                id="notes"
                title="Notatki"
                summary={openNotes > 0 ? `${openNotes} do zrobienia` : undefined}
                open={!collapsed.notes}
                onToggle={toggleNotes}
                className={`${PANEL} min-[900px]:[grid-area:notes]`}
              >
                <RemotePanel
                  sessionStatus={session.status}
                  listStatus={notes.status}
                  subject="wspólne notatki"
                  onSignInClick={openSignIn}
                  onRetry={notes.reload}
                  actionError={notes.actionError}
                >
                  <NotesPanel notes={notes} />
                </RemotePanel>
              </CollapsiblePanel>
            </>
          )}
        </div>
        <SiteFooter onRequestClick={() => setTicket('request')} />
      </main>
      <FloatingReportButton onClick={() => setTicket('bug')} />
      <TicketDialog type={ticket} onClose={() => setTicket(null)} bugContext={bugContext} />
      <AuthDialog session={session} open={authOpen} onClose={() => setAuthOpen(false)} />
    </AssetLibraryContext>
  )
}

export default App
