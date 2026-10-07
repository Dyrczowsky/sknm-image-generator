import { useEffect, useRef, useState } from 'react'
import type { HistoryEntry, PosterLang } from './types'
import { AssetLibraryContext } from './assets/AssetLibraryContext'
import { useAssetLibrary } from './assets/useAssetLibrary'
import { useEditor } from './editor/useEditor'
import { usePosterExport } from './editor/usePosterExport'
import { posterRegistry } from './posters/registry'
import { SCHEME_LABELS } from './posters/schemes'
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
import { AppShell } from './components/AppShell'
import { AuthControl } from './components/AuthControl'
import { AuthDialog } from './components/AuthDialog'
import { LangToggle } from './components/LangToggle'
import { ShortcutsHelp } from './components/ShortcutsHelp'
import { TicketDialog } from './components/TicketDialog'
import type { TicketType } from './components/TicketDialog'
import { TopBar } from './components/TopBar'
import { Button } from './components/ui'
import { AssetsPage } from './pages/AssetsPage'
import { EditorPage } from './pages/EditorPage'
import { HistoryPage } from './pages/HistoryPage'
import { NotesPage } from './pages/NotesPage'
import { ProjectsPage } from './pages/ProjectsPage'
import type { BugContextInput } from './utils/issueUrl'
import { PAGES, useHashRoute } from './utils/route'
import type { Page } from './utils/route'
import { EDITOR_TAB_STORAGE_KEY, parseEditorTab, serializeEditorTab } from './utils/uiState'
import type { EditorTab } from './utils/uiState'
import { useStoredState } from './utils/useStoredState'
import { useWorkspace } from './workspace/useWorkspace'

const LANG_STORAGE_KEY = 'sknm-poster-lang'
const LANG_STORAGE = {
  parse: (raw: string | null): PosterLang => (raw === 'en' ? 'en' : 'pl'),
  serialize: (lang: PosterLang) => lang,
}
const TAB_STORAGE = { parse: parseEditorTab, serialize: serializeEditorTab }
const KNOWN_LAYOUTS = Object.keys(posterRegistry)
const APP_TITLE = 'Generator obrazów SKNM'

// Powłoka aplikacji. Tu są złożone WSZYSTKIE hooki stanu (edytor, eksport,
// sesja, kopia robocza, listy wspólne), więc stan edytora przeżywa przejście
// na inną stronę; strony dostają dane i akcje przez propsy. Strona edytora
// jest stale w drzewie (patrz `AppShell`) - `posterRef` wskazuje węzeł, z
// którego powstaje plik.
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
  const [tab, setTab] = useStoredState(EDITOR_TAB_STORAGE_KEY, TAB_STORAGE)
  const [ticket, setTicket] = useState<TicketType | null>(null)
  const [route, setPage] = useHashRoute()
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
  // Bez Supabase aplikacja nie ma logowania ani stron z danymi wspólnymi -
  // adres takiej strony pokazuje wtedy edytor.
  const shared = session.status !== 'unconfigured'
  const page: Page = shared ? route : 'editor'
  const openSignIn = () => setAuthOpen(true)

  // Wejście na stronę odświeża jej listę - nie ma synchronizacji na żywo.
  useEffect(() => {
    if (!signedIn) return
    if (page === 'projects') projects.reload()
    else if (page === 'assets') library.reload()
    else if (page === 'history') history.reload()
    else if (page === 'notes') notes.reload()
    // Tylko zmiana strony; zalogowanie i tak wczytuje listy od nowa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    const label = PAGES.find((item) => item.page === page)?.label
    document.title = page === 'editor' || !label ? APP_TITLE : `${label} — ${APP_TITLE}`
  }, [page])

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

  // Skrót zakładki działa z każdej strony: wraca do edytora i ją otwiera.
  const showTab = (next: EditorTab) => {
    setTab(next)
    if (page !== 'editor') setPage('editor')
  }

  useShortcuts({
    save: handleSave,
    export: handleDownload,
    tabTemplate: () => showTab('template'),
    tabContent: () => showTab('content'),
    tabLook: () => showTab('look'),
    help: () => setHelpOpen((open) => !open),
  })

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p>Ładowanie…</p>
      </main>
    )
  }

  const openNotes = notes.items.filter((note) => !note.done).length
  const enabledShortcuts: ShortcutId[] = ['save', 'export', 'tabTemplate', 'tabContent', 'tabLook', 'help']
  const openProject = workspace.project

  // Wpis historii otwiera się jako nowa, niezapisana praca - nigdy nie
  // nadpisuje otwartego projektu. Stary wpis (bez snapshotu) albo nieczytelny
  // wraca z wąskich kolumn; wpisu z nowszej wersji aplikacji nie otwieramy.
  const restoreHistory = (entry: HistoryEntry) => {
    const parsed = parseSnapshot(entry.snapshot, KNOWN_LAYOUTS)
    const legacy = !parsed.ok && parsed.reason === 'invalid'
    void workspace.open(legacy ? snapshotFromLegacyHistory(entry, lang) : entry.snapshot, null).then(toEditor)
  }

  // Udane otwarcie przenosi do edytora. Nieudane (odmowa użytkownika, błąd)
  // zostawia na liście - powód pokazuje komunikat kopii roboczej nad stroną.
  const toEditor = (done: boolean) => {
    if (done) setPage('editor')
  }
  const openFromList = (row: ProjectRow) => void workspace.openProject(row).then(toEditor)
  const startNew = () => void workspace.newProject().then(toEditor)

  const renameProject = (id: number, name: string) => {
    void projects.rename(id, name).then((ok) => {
      if (ok) workspace.renamed(id, name)
    })
  }

  // Usunięcie otwartego projektu zostawia jego treść jako wersję roboczą.
  const deleteProject = (row: ProjectRow) => {
    const open = row.id === openProject?.id
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
      <AppShell
        page={page}
        topBar={
          <TopBar
            page={page}
            remote={shared}
            openNotes={openNotes}
            help={
              <ShortcutsHelp
                enabled={shared ? enabledShortcuts : enabledShortcuts.filter((id) => id !== 'save')}
                isMac={isMacPlatform()}
                open={helpOpen}
                onOpenChange={setHelpOpen}
                onTicket={setTicket}
              />
            }
            language={<LangToggle value={lang} onChange={setLang} />}
            account={<AuthControl session={session} onSignInClick={openSignIn} onSignOut={() => void workspace.signOut(session.signOut)} />}
          />
        }
        editor={
          <EditorPage
            editor={editor}
            exporter={exporter}
            lang={lang}
            posterRef={posterRef}
            tab={tab}
            onTabChange={setTab}
            onDownload={handleDownload}
            project={{
              name: openProject?.name ?? null,
              status: workspace.status,
              cloud: shared,
              notice: workspace.notice,
              missingCount: workspace.missingCount,
              onSave: handleSave,
              onNew: () => void workspace.newProject(),
              onDismissNotice: workspace.dismissNotice,
              onRetryMissing: () => void workspace.retryMissing(),
              onDropMissing: workspace.dropMissing,
              onLoadCloud: () => void workspace.loadCloudVersion(),
              onOverwrite: () => void workspace.overwriteCloudVersion(),
              // Nazwę zmienia tylko zalogowany właściciel otwartego projektu.
              onRename: openProject && openProject.ownerId === userId ? (name) => renameProject(openProject.id, name) : undefined,
            }}
          />
        }
      >
        {workspace.notice && (
          <p role="alert" className="m-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-b border-border bg-danger-soft px-4 py-2 text-[0.8125rem] leading-snug text-danger">
            <span>{workspace.notice}</span>
            <Button variant="ghost" onClick={workspace.dismissNotice}>Zamknij</Button>
          </p>
        )}
        {page === 'projects' && (
          <ProjectsPage
            sessionStatus={session.status}
            projects={projects}
            userId={session.userId ?? ''}
            currentId={openProject?.id ?? null}
            lang={lang}
            onSignInClick={openSignIn}
            onOpen={openFromList}
            onRename={(row, name) => renameProject(row.id, name)}
            onShare={(row, isShared) => void projects.setShared(row.id, isShared)}
            onDelete={deleteProject}
            onNew={startNew}
          />
        )}
        {page === 'assets' && <AssetsPage sessionStatus={session.status} library={library} onSignInClick={openSignIn} />}
        {page === 'history' && (
          <HistoryPage sessionStatus={session.status} history={history} lang={lang} onSignInClick={openSignIn} onRestore={restoreHistory} />
        )}
        {page === 'notes' && <NotesPage sessionStatus={session.status} notes={notes} onSignInClick={openSignIn} />}
      </AppShell>
      <TicketDialog type={ticket} onClose={() => setTicket(null)} bugContext={bugContext} />
      <AuthDialog session={session} open={authOpen} onClose={() => setAuthOpen(false)} />
    </AssetLibraryContext>
  )
}

export default App
