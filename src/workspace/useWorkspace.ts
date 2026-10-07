import { useEffect, useRef, useState } from 'react'
import { ensureUploaded, gcLocal, hydrate } from '../assets/assets'
import type { UploadedAsset } from '../assets/assets'
import { refOf, srcOf } from '../assets/registry'
import { getDb } from '../db/client'
import { getDraft } from '../db/drafts'
import { listTemplates } from '../db/templates'
import type { Editor } from '../editor/useEditor'
import type { PosterExport } from '../editor/usePosterExport'
import { posterRegistry } from '../posters/registry'
import { createProject, getProject, saveProject } from '../projects/remoteProjects'
import type { ProjectRow } from '../projects/remoteProjects'
import { SNAPSHOT_VERSION, assetRefsOf, fromSnapshot, isBlank, parseSnapshot, snapshotFromLegacyDraft, toSnapshot } from '../snapshot/snapshot'
import type { EditorSnapshot, ParseResult } from '../snapshot/snapshot'
import { requireSupabase, supabase } from '../supabase/client'
import type { PosterLang } from '../types'
import { retainMissing } from './missingAssets'
import type { MissingAssets } from './missingAssets'
import { createWorkspaceEngine } from './syncEngine'
import type { EngineState, SaveResult } from './syncEngine'
import { afterSignOut, bindingOf } from './syncState'
import type { ProjectBinding, Workspace } from './syncState'
import { workspaceStore } from './workspaceStore'
import type { WorkspaceRead } from './workspaceStore'

const KNOWN_LAYOUTS = Object.keys(posterRegistry)

const NEEDS_NEWER_APP = 'Odśwież stronę — projekt wymaga nowszej wersji aplikacji'
const UNREADABLE = 'Nie udało się odczytać zapisanego stanu plakatu.'
const PROJECT_GONE = 'Tego projektu nie ma już w chmurze. Bieżąca treść została jako wersja robocza na tym urządzeniu.'
const LOAD_FAILED = 'Nie udało się wczytać projektu. Sprawdź połączenie i spróbuj ponownie.'
const SAVE_FAILED = 'Nie udało się zapisać projektu. Sprawdź połączenie i spróbuj ponownie.'

type Rejection = Extract<ParseResult, { ok: false }>['reason']
const refusal = (reason: Rejection) => (reason === 'invalid' ? UNREADABLE : NEEDS_NEWER_APP)

// Pusty plakat w danym layoucie: wszystkie pola domyślne, świeże obiekty.
function blankSnapshot(posterKey: string, lang: PosterLang): EditorSnapshot {
  const parsed = parseSnapshot({ v: SNAPSHOT_VERSION, poster_key: posterKey, lang }, [posterKey])
  if (!parsed.ok) throw new Error('Nie udało się zbudować pustego snapshotu')
  return parsed.snapshot
}

interface WorkspaceOptions {
  editor: Editor
  exporter: PosterExport
  lang: PosterLang
  setLang: (lang: PosterLang) => void
  // Zalogowana osoba; `null` = nikt (albo build bez Supabase), `undefined` =
  // sesja jeszcze się wczytuje.
  userId: string | null | undefined
  // Każda grafika świeżo wgrana do Storage (wpis do wspólnej biblioteki).
  onUploaded?: (asset: UploadedAsset) => Promise<void> | void
  // Każdy wiersz projektu zapisany albo pobrany na świeżo (lista projektów).
  onProjectSaved?: (row: ProjectRow) => void
}

// Kopia robocza: łączy edytor, ustawienia eksportu i język w jeden snapshot,
// zapisuje go lokalnie (zawsze) i w chmurze (gdy jest przypięty do projektu),
// a w drugą stronę wczytuje snapshoty do wszystkich trzech naraz. Decyzje
// są w `syncState.ts`, harmonogram zapisów w `syncEngine.ts`; tu jest tylko
// spięcie tego z Reactem, IndexedDB i Supabase.
export function useWorkspace(options: WorkspaceOptions) {
  const { editor, exporter, lang, userId } = options
  const [ready, setReady] = useState(false)
  const [view, setView] = useState<EngineState>({ project: null, status: 'local', dirty: false })
  // Numer wczytanego dokumentu z silnika - patrz `observe`.
  const [epoch, setEpoch] = useState(0)
  const [missing, setMissing] = useState<MissingAssets | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Najnowsze propsy i stan dla kodu asynchronicznego (po `await` domknięcia
  // z renderu, w którym go uruchomiono, są już nieaktualne).
  const latest = useRef(options)
  const missingRef = useRef<MissingAssets | null>(null)
  const current = useRef<EditorSnapshot | null>(null)
  // Trwa wczytywanie dokumentu - kolejne otwarcie musi poczekać.
  const busy = useRef(false)
  // Lokalną kopię zapisała nowsza wersja aplikacji: nie wolno jej nadpisać.
  const localLocked = useRef(false)
  // Podmieniane co render - silnik powstaje raz i woła zawsze bieżącą wersję.
  const settleConflict = useRef<() => Promise<void>>(async () => {})

  const [engine] = useState(() =>
    createWorkspaceEngine({
      writeLocal: (workspace) => (localLocked.current ? Promise.resolve() : workspaceStore.write(workspace)),
      upload: (snapshot) => upload(snapshot, missingRef.current, latest.current.onUploaded),
      create: (name, snapshot) => createProject(requireSupabase(), { name, snapshot }),
      save: (id, revision, snapshot) => saveProject(requireSupabase(), id, revision, snapshot),
      onSaved: (row) => latest.current.onProjectSaved?.(row),
      onConflict: () => void settleConflict.current(),
      onChange: setView,
    }),
  )

  // Bieżący stan jako snapshot. `computed` to dokładnie to, co widać na
  // plakacie; `merged` dodatkowo niesie grafiki, których nie udało się wczytać,
  // żeby zapis ich nie zgubił.
  const posterKey = editor.template?.poster_key
  const computed =
    ready && posterKey
      ? toSnapshot({ posterKey, colorScheme: editor.colorScheme ?? null, lang, exportSettings: exporter.settings, form: editor.form }, refOf)
      : null
  const merged = computed ? retainMissing(computed, missing) : null
  const serialized = merged ? JSON.stringify(merged) : null

  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    current.current = merged
    if (merged && serialized !== null) engine.observe(merged, serialized, epoch)
    // `merged` jest nowym obiektem co render - o zmianie mówi `serialized`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, serialized, epoch])

  // Wczytuje snapshot do edytora, eksportu i języka w jednym renderze. Grafiki
  // muszą być już w rejestrze (`hydrate`); te, których nie ma, trafiają do `missing`.
  const commit = (snapshot: EditorSnapshot, project: ProjectBinding | null, dirty: boolean) => {
    const state = fromSnapshot(snapshot, srcOf)
    const lost: MissingAssets | null = state.missing.length > 0 ? { refs: state.missing, source: snapshot } : null
    const target = latest.current
    missingRef.current = lost
    const nextEpoch = engine.load({ snapshot, project, dirty })
    target.editor.applyState({ posterKey: state.posterKey, colorScheme: state.colorScheme, form: state.form })
    target.exporter.applySettings(state.exportSettings)
    target.setLang(state.lang)
    setMissing(lost)
    setEpoch(nextEpoch)
  }

  // Start: lokalna kopia robocza, a gdy jej nie ma - draft sprzed tej zmiany.
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      const db = await getDb()
      const templates = listTemplates(db)
      const fallbackKey = templates.find((t) => KNOWN_LAYOUTS.includes(t.poster_key))?.poster_key ?? KNOWN_LAYOUTS[0]
      const startLang = latest.current.lang

      let read: WorkspaceRead | null
      try {
        read = await workspaceStore.read(KNOWN_LAYOUTS)
      } catch {
        read = null
      }

      let workspace: Workspace
      // Sprzątanie grafik tylko wtedy, gdy wiemy na pewno, czego kopia używa.
      let collect = read !== null
      if (read?.kind === 'ok') {
        workspace = read.workspace
      } else if (read?.kind === 'absent') {
        const draft = getDraft(db)
        const draftKey = templates.find((t) => t.id === draft?.template_id)?.poster_key
        const snapshot = draft ? snapshotFromLegacyDraft(draft, draftKey ?? fallbackKey, startLang) : blankSnapshot(fallbackKey, startLang)
        workspace = { snapshot, project: null, dirty: !isBlank(snapshot) }
      } else {
        if (read && read.reason !== 'invalid') {
          localLocked.current = true
          collect = false
        }
        workspace = { snapshot: blankSnapshot(fallbackKey, startLang), project: null, dirty: false }
      }

      await hydrate(assetRefsOf(workspace.snapshot), supabase)
      if (cancelled) return
      commit(workspace.snapshot, workspace.project, workspace.dirty)
      if (localLocked.current) setNotice(NEEDS_NEWER_APP)
      setReady(true)
      if (collect) void gcLocal(assetRefsOf(workspace.snapshot)).catch(() => {})
    }
    void boot()
    return () => {
      cancelled = true
    }
    // Jednorazowo przy starcie; `commit` korzysta wyłącznie z refów i silnika.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Karta schodzi z ekranu (także tuż przed zamknięciem): zapis od razu.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') engine.flushSoon()
    }
    const onPageHide = () => engine.flushSoon()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      engine.dispose()
    }
  }, [engine])

  // Wczytuje do edytora wiersz z chmury jako otwarty projekt. `recheck` -
  // wołane w tle: jeśli w trakcie pobierania grafik użytkownik coś zmienił,
  // decyzja zapada od nowa (i kończy się konfliktem zamiast nadpisania).
  const adoptRemote = async (row: ProjectRow, recheck: boolean): Promise<boolean> => {
    const parsed = parseSnapshot(row.snapshot, KNOWN_LAYOUTS)
    if (!parsed.ok) {
      setNotice(refusal(parsed.reason))
      return false
    }
    if (busy.current) return false
    busy.current = true
    try {
      await hydrate(assetRefsOf(parsed.snapshot), supabase)
      if (engine.getState().project?.id !== row.id) return false
      if (recheck && engine.reconcileRemote(row).kind !== 'applyRemote') return false
      commit(parsed.snapshot, bindingOf(row), false)
      return true
    } finally {
      busy.current = false
    }
  }

  // Właściciel przypiętego projektu jest zalogowany: porównanie z chmurą.
  const checkRemote = async () => {
    const bound = engine.getState().project
    if (!bound || !supabase) return
    let row: ProjectRow | null
    try {
      row = await getProject(supabase, bound.id)
    } catch {
      // Brak sieci: zostaje to, co lokalnie; zapis zmian spróbuje sam.
      engine.retrySync()
      return
    }
    if (engine.getState().project?.id !== bound.id) return
    const decision = engine.reconcileRemote(row)
    if (decision.kind === 'drop') setNotice(PROJECT_GONE)
    if (decision.kind !== 'applyRemote') return
    // Wersji z chmury nie umiemy odczytać: bez odpięcia autozapis by ją nadpisał.
    if (!parseSnapshot(decision.row.snapshot, KNOWN_LAYOUTS).ok) engine.detach()
    await adoptRemote(decision.row, true)
  }

  // Zapis odbił się od nowszej wersji. Zanim zapytamy użytkownika, sprawdzamy,
  // czy to nie nasz własny zapis, którego odpowiedź nie doszła (ta sama treść).
  const checkConflict = async () => {
    const bound = engine.getState().project
    if (!bound || !supabase) return
    let row: ProjectRow | null
    try {
      row = await getProject(supabase, bound.id)
    } catch {
      return
    }
    const state = engine.getState()
    if (state.project?.id !== bound.id || state.status !== 'conflict') return
    if (engine.reconcileRemote(row).kind === 'drop') setNotice(PROJECT_GONE)
  }

  useEffect(() => {
    settleConflict.current = checkConflict
  })

  // Ponawia pobranie grafik, których nie udało się wczytać przy otwieraniu.
  const retryMissing = async () => {
    const lost = missingRef.current
    if (!lost || busy.current) return
    busy.current = true
    try {
      const unresolved = await hydrate([...lost.refs], supabase)
      if (missingRef.current !== lost || unresolved.length === lost.refs.length) return
      const snapshot = current.current
      if (!snapshot) return
      // Bieżący stan (z dopisanymi brakami) jeszcze raz przez rejestr grafik.
      const state = fromSnapshot(snapshot, srcOf)
      const still: MissingAssets | null = state.missing.length > 0 ? { refs: state.missing, source: snapshot } : null
      missingRef.current = still
      latest.current.editor.applyState({ posterKey: state.posterKey, colorScheme: state.colorScheme, form: state.form })
      setMissing(still)
    } finally {
      busy.current = false
    }
  }

  useEffect(() => {
    if (!ready || userId === undefined) return
    if (engine.setUser(userId) === 'resume') void checkRemote()
    // Po zalogowaniu Storage jest dostępny - brakujące grafiki mogą się znaleźć.
    if (userId !== null && missingRef.current) void retryMissing()
    // `checkRemote` i `retryMissing` korzystają wyłącznie z refów i silnika.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, ready, userId])

  // Niezapisaną, niepustą wersję roboczą zastępujemy dopiero po potwierdzeniu.
  const confirmDiscard = (): boolean => {
    const { project, dirty } = engine.getState()
    const snapshot = current.current
    if (project || !dirty || !snapshot || isBlank(snapshot)) return true
    return window.confirm('Bieżąca wersja robocza nie jest zapisana jako projekt i zostanie zastąpiona. Kontynuować?')
  }

  // Otwarty projekt musi trafić do chmury, zanim zastąpi go coś innego.
  const leave = async (): Promise<boolean> => {
    // Wersja robocza kończy tu najwyżej trwające tworzenie projektu.
    if (await engine.flush()) return true
    const { project } = engine.getState()
    if (!project) return true
    setNotice(`Nie udało się zapisać projektu „${project.name}" w chmurze, więc zostaje otwarty. Spróbuj ponownie za chwilę.`)
    return false
  }

  // Wspólna droga każdej zamiany dokumentu w edytorze.
  const replaceWith = async (target: () => Promise<{ raw: unknown; project: ProjectBinding | null } | null>): Promise<boolean> => {
    if (!ready || busy.current) return false
    busy.current = true
    try {
      setNotice(null)
      if (!confirmDiscard()) return false
      if (!(await leave())) return false
      const next = await target()
      if (!next) return false
      const parsed = parseSnapshot(next.raw, KNOWN_LAYOUTS)
      if (!parsed.ok) {
        setNotice(refusal(parsed.reason))
        return false
      }
      await hydrate(assetRefsOf(parsed.snapshot), supabase)
      // Zmiany zrobione w czasie pobierania grafik też muszą dojść do chmury.
      if (!(await leave())) return false
      commit(parsed.snapshot, next.project, false)
      return true
    } finally {
      busy.current = false
    }
  }

  // Otwiera snapshot (surowy JSON albo już sprawdzony): z przypięciem jako
  // własny projekt, bez niego jako nową, niezapisaną pracę. Snapshot z nowszej
  // wersji aplikacji albo z nieznanym layoutem nie jest otwierany.
  const open = async (raw: unknown, project: ProjectBinding | null): Promise<boolean> => {
    const parsed = parseSnapshot(raw, KNOWN_LAYOUTS)
    if (!parsed.ok) {
      setNotice(refusal(parsed.reason))
      return false
    }
    return replaceWith(async () => ({ raw: parsed.snapshot, project }))
  }

  // Otwiera projekt z listy: własny z przypięciem, cudzy (udostępniony) jako
  // kopię. Wiersz jest pobierany na świeżo - lista mogła się zestarzeć.
  const openProject = (row: ProjectRow): Promise<boolean> =>
    replaceWith(async () => {
      let fresh: ProjectRow | null
      try {
        fresh = await getProject(requireSupabase(), row.id)
      } catch {
        setNotice(LOAD_FAILED)
        return null
      }
      if (!fresh) {
        setNotice('Tego projektu nie ma już w chmurze.')
        return null
      }
      const own = fresh.owner === latest.current.userId
      if (own) latest.current.onProjectSaved?.(fresh)
      return { raw: fresh.snapshot, project: own ? bindingOf(fresh) : null }
    })

  // Pusty plakat w bieżącym layoucie i języku, bez projektu.
  const newProject = (): Promise<boolean> =>
    replaceWith(async () => ({ raw: blankSnapshot(current.current?.poster_key ?? KNOWN_LAYOUTS[0], latest.current.lang), project: null }))

  // „Zapisz": pierwszy raz tworzy projekt (nazwa z tytułu) i go przypina.
  const saveNow = async (): Promise<SaveResult> => {
    if (!ready || !supabase) return 'failed'
    const result = await engine.saveNow()
    setNotice(result === 'failed' ? SAVE_FAILED : null)
    return result
  }

  // Wylogowanie przez kopię roboczą: projekt najpierw idzie do chmury.
  const signOut = async (doSignOut: () => Promise<unknown>): Promise<void> => {
    // W trakcie wczytywania dokumentu nie ruszamy kopii: projekt zostanie
    // wstrzymany przez zmianę sesji.
    if (busy.current) {
      await doSignOut()
      return
    }
    busy.current = true
    try {
      const state = engine.getState()
      const snapshot = current.current
      if (snapshot && state.project) {
        const outcome = afterSignOut({ snapshot, project: state.project, dirty: state.dirty }, await engine.flush())
        if (outcome === 'blank') {
          commit(blankSnapshot(snapshot.poster_key, latest.current.lang), null, false)
        } else if (outcome === 'detach') {
          engine.detach()
          setNotice('Nie udało się zapisać zmian w chmurze przed wylogowaniem. Treść została na tym urządzeniu jako wersja robocza.')
        }
      }
      await doSignOut()
    } finally {
      busy.current = false
    }
  }

  // Wiersz otwartego projektu do rozstrzygnięcia konfliktu; `undefined` = brak sieci.
  const fetchBound = async (): Promise<ProjectRow | null | undefined> => {
    const bound = engine.getState().project
    if (!bound || !supabase) return undefined
    try {
      return await getProject(supabase, bound.id)
    } catch {
      setNotice(LOAD_FAILED)
      return undefined
    }
  }

  // Konflikt: porzuca lokalne zmiany i wczytuje to, co jest w chmurze.
  const loadCloudVersion = async (): Promise<void> => {
    const row = await fetchBound()
    if (row === undefined) return
    if (row === null) {
      engine.detach()
      setNotice(PROJECT_GONE)
      return
    }
    if (await adoptRemote(row, false)) setNotice(null)
  }

  // Konflikt: bieżąca treść zastępuje wersję z chmury.
  const overwriteCloudVersion = async (): Promise<void> => {
    const row = await fetchBound()
    if (row === undefined) return
    // Wersji zapisanej przez nowszą aplikację nie nadpisujemy starszym formatem.
    const parsed = row ? parseSnapshot(row.snapshot, KNOWN_LAYOUTS) : null
    if (parsed && !parsed.ok && parsed.reason !== 'invalid') {
      setNotice(NEEDS_NEWER_APP)
      return
    }
    const saved = await engine.overwrite(row)
    setNotice(row === null ? PROJECT_GONE : saved ? null : SAVE_FAILED)
  }

  // Użytkownik rezygnuje z grafik, których nie udało się wczytać - od teraz
  // zapis ich nie zawiera.
  const dropMissing = () => {
    missingRef.current = null
    setMissing(null)
  }

  return {
    ready,
    // Projekt, do którego przypięta jest kopia (`null` = wersja robocza).
    project: view.project,
    status: view.status,
    // Stan widoczny na plakacie jako snapshot (np. do wpisu historii).
    snapshot: computed,
    notice,
    dismissNotice: () => setNotice(null),
    missingCount: missing?.refs.length ?? 0,
    retryMissing,
    dropMissing,
    open,
    openProject,
    newProject,
    saveNow,
    signOut,
    loadCloudVersion,
    overwriteCloudVersion,
    // Otwarty projekt usunięto z listy: treść zostaje wersją roboczą.
    detach: engine.detach,
    // Nazwę projektu zmieniono na liście.
    renamed: engine.rename,
    // Wgrywa grafiki snapshotu do Storage (np. przed wpisem do historii).
    uploadAssets: (snapshot: EditorSnapshot) => upload(snapshot, missingRef.current, latest.current.onUploaded),
  }
}

// Grafik, których nie udało się wczytać, nie ma lokalnie - są pomijane (do
// projektu trafiły z chmury, więc w Storage już leżą).
async function upload(snapshot: EditorSnapshot, missing: MissingAssets | null, onUploaded: WorkspaceOptions['onUploaded']): Promise<void> {
  const lost = new Set(missing?.refs)
  await ensureUploaded(assetRefsOf(snapshot).filter((ref) => !lost.has(ref)), requireSupabase(), onUploaded)
}

export type WorkspaceApi = ReturnType<typeof useWorkspace>
