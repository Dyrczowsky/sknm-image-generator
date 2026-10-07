import { useCallback, useEffect, useRef, useState } from 'react'
import type { Database } from 'sql.js'
import type { AccentName, FileType, FormValues, FormTextField, HistoryRow, Medium, Orientation, PosterLang, TemplateRow } from './types'
import { getDb } from './db/client'
import { listTemplates } from './db/templates'
import { getDraft, saveDraft, parseVisibility } from './db/drafts'
import { addHistoryEntry, deleteHistoryEntry, listHistory } from './db/history'
import { posterRegistry } from './posters/registry'
import { schemesFor, SCHEME_LABELS, accentAllowed } from './posters/schemes'
import { MAX_GRAPHICS } from './posters/theme'
import { downloadPoster } from './posters/export'
import { DEFAULT_FORMAT, formatsFor, isPrintFormat, shapeFor } from './posters/formats'
import { SHAPE_SIZE } from './posters/shape'
import { useElementWidth } from './utils/useElementWidth'
import { TemplateSelector } from './components/TemplateSelector'
import { SchemeSelector } from './components/SchemeSelector'
import { LangToggle } from './components/LangToggle'
import { SegmentedToggle } from './components/SegmentedToggle'
import { CollapsiblePanel } from './components/CollapsiblePanel'
import { PosterPreview } from './components/PosterPreview'
import { HistoryList } from './components/HistoryList'
import { TicketDialog } from './components/TicketDialog'
import { FloatingReportButton } from './components/FloatingReportButton'
import { SiteFooter } from './components/SiteFooter'
import { encodeScheme, decodeScheme } from './utils/colorScheme'
import type { BugContextInput } from './utils/issueUrl'
import { COLLAPSED_STORAGE_KEY, parseCollapsed } from './utils/collapsedPanels'
import type { CollapsedPanels, PanelKey } from './utils/collapsedPanels'

const LANG_STORAGE_KEY = 'sknm-poster-lang'

// Górne granice podglądu banera (px na ekranie): szerokość i wysokość -
// wyższy baner wydarzenia nie może wypchnąć kolorystyki poza okno.
const BANNER_PREVIEW_MAX_W = 1100
const BANNER_PREVIEW_MAX_H = 460

const ORIENTATION_OPTIONS = [
  { value: 'portrait', label: 'Pion' },
  { value: 'landscape', label: 'Poziom' },
] as const

const FILE_TYPE_OPTIONS = [
  { value: 'png', label: 'PNG' },
  { value: 'pdf', label: 'PDF' },
] as const

function loadStoredLang(): PosterLang {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'pl'
  } catch {
    return 'pl'
  }
}

function loadStoredCollapsed(): CollapsedPanels {
  try {
    return parseCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY))
  } catch {
    return parseCollapsed(null)
  }
}

const EMPTY_FORM: FormValues = {
  title: '',
  subtitle: '',
  speaker: '',
  event_date: '',
  event_time: '',
  location: '',
  badge: '',
  badge2: '',
  body: '',
  visibility: {},
  graphics: [],
  showPkLogo: true,
  qrUrl: '',
  photos: {},
  lists: {},
  titleScale: 1,
  textScale: 1,
  scaleLinked: true,
}

// Domyślny schemat kolorów danego layoutu = pierwszy schemat z `schemes.ts`.
// `undefined` tylko gdy layout nie ma żadnego schematu; `resolveScheme` użyje
// wtedy bloku bazowego.
function defaultSchemeFor(templateId: number | null, templates: TemplateRow[]): string | undefined {
  const tpl = templates.find((t) => t.id === templateId)
  const list = tpl ? schemesFor(tpl.poster_key) : []
  return list[0]
}

function App() {
  const dbRef = useRef<Database | null>(null)
  const posterRef = useRef<HTMLDivElement | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [ready, setReady] = useState(false)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedScheme, setSelectedScheme] = useState<string | undefined>(undefined)
  const [selectedAccent, setSelectedAccent] = useState<AccentName | undefined>(undefined)
  const [lang, setLang] = useState<PosterLang>(loadStoredLang)
  const [collapsed, setCollapsed] = useState<CollapsedPanels>(loadStoredCollapsed)
  const togglePanel = (key: PanelKey) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [history, setHistory] = useState<HistoryRow[]>([])
  // Zakładka wyboru szablonu: grafika social/druk albo baner. Sesyjna, jak
  // `exportFormat` - po odświeżeniu wraca „Social media".
  const [medium, setMedium] = useState<Medium>('social')
  const [exportFormat, setExportFormat] = useState(DEFAULT_FORMAT.social)
  // Orientacja strony i typ pliku dotyczą tylko formatów papierowych
  // (A4/A3/A2). Sesyjne, jak `exportFormat` - bez zapisu do draftu.
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [fileType, setFileType] = useState<FileType>('png')
  const [exporting, setExporting] = useState(false)
  const [exportNote, setExportNote] = useState<string | null>(null)
  const printFormat = isPrintFormat(exportFormat)
  const effectiveFileType: FileType = printFormat ? fileType : 'png'
  const banner = medium === 'banner'
  const shape = shapeFor(exportFormat, orientation)
  // Baner jest szeroki i niski - podgląd zajmuje wtedy całą szerokość
  // kreatora, a jego rozmiar idzie za szerokością panelu.
  const [previewBoxRef, previewBoxWidth] = useElementWidth<HTMLDivElement>()
  const shapeSize = SHAPE_SIZE[shape]
  const bannerPreviewSize =
    previewBoxWidth > 0
      ? Math.min(previewBoxWidth, BANNER_PREVIEW_MAX_W, Math.round((BANNER_PREVIEW_MAX_H * shapeSize.width) / shapeSize.height))
      : undefined
  const [ticket, setTicket] = useState<null | 'bug' | 'request'>(null)

  useEffect(() => {
    let cancelled = false
    getDb().then((db) => {
      if (cancelled) return
      dbRef.current = db
      const tpls = listTemplates(db)
      setTemplates(tpls)

      const draft = getDraft(db)
      const initialTemplateId = draft?.template_id ?? tpls[0]?.id ?? null
      if (draft) {
        setForm({
          title: draft.title ?? '',
          subtitle: draft.subtitle ?? '',
          speaker: draft.speaker ?? '',
          event_date: draft.event_date ?? '',
          event_time: draft.event_time ?? '',
          location: draft.location ?? '',
          badge: draft.badge ?? '',
          badge2: draft.badge2 ?? '',
          body: draft.body ?? '',
          visibility: parseVisibility(draft.visibility),
          graphics: [],
          showPkLogo: true,
          qrUrl: '',
          photos: {},
          lists: {},
          titleScale: 1,
          textScale: 1,
          scaleLinked: true,
        })
      }
      setSelectedTemplateId(initialTemplateId)
      const { scheme, accent } = decodeScheme(draft?.color_scheme)
      const initScheme = scheme ?? defaultSchemeFor(initialTemplateId, tpls)
      const initKey = tpls.find((t) => t.id === initialTemplateId)?.poster_key ?? ''
      setSelectedScheme(initScheme)
      setSelectedAccent(accentAllowed(initKey, initScheme, accent) ? accent : undefined)

      setHistory(listHistory(db))
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {
      // localStorage niedostępny (np. tryb prywatny) — język zostaje tylko w pamięci sesji.
    }
  }, [lang])

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed))
    } catch {
      // localStorage niedostępny — stan paneli zostaje tylko w pamięci sesji.
    }
  }, [collapsed])

  const persistDraft = useCallback(
    (
      nextForm: FormValues,
      templateId: number | null,
      schemeName: string | undefined,
      accent: AccentName | undefined,
    ) => {
      const db = dbRef.current
      if (!db) return
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft(db, { ...nextForm, template_id: templateId, color_scheme: encodeScheme(schemeName, accent) ?? null })
      }, 400)
    },
    [],
  )

  const handleFieldChange = (name: FormTextField, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  // Odznaczenie ukrywa pole na plakacie (opacity: 0). `true` chowamy jako brak
  // klucza, żeby draft trzymał tylko rzeczywiste wyjątki.
  const handleVisibilityChange = (name: FormTextField, visible: boolean) => {
    setForm((prev) => {
      const nextVisibility = { ...prev.visibility }
      if (visible) delete nextVisibility[name]
      else nextVisibility[name] = false
      const next = { ...prev, visibility: nextVisibility }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handleGraphicsAdd = (srcs: string[]) => {
    setForm((prev) => {
      const next = { ...prev, graphics: [...prev.graphics, ...srcs].slice(0, MAX_GRAPHICS) }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handleGraphicRemove = (index: number) => {
    setForm((prev) => {
      const next = { ...prev, graphics: prev.graphics.filter((_, i) => i !== index) }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handleGraphicMove = (index: number, dir: -1 | 1) => {
    setForm((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.graphics.length) return prev
      const g = [...prev.graphics]
      const tmp = g[index]
      g[index] = g[j]
      g[j] = tmp
      const next = { ...prev, graphics: g }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handleShowPkChange = (value: boolean) => {
    setForm((prev) => {
      const next = { ...prev, showPkLogo: value }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handleQrUrlChange = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, qrUrl: value }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  // Galeria zdjęć: dodanie nowego pliku zawsze dokłada kolejny wpis do listy.
  const handlePhotoAdd = (fieldKey: string, src: string | null) => {
    if (!src) return
    setForm((prev) => {
      const list = prev.photos[fieldKey] ?? []
      const next = { ...prev, photos: { ...prev.photos, [fieldKey]: [...list, { src, x: 50, y: 50 }] } }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  // Zmiana pliku pod istniejącym wpisem galerii; `null` usuwa ten wpis.
  const handlePhotoChangeAt = (fieldKey: string, index: number, src: string | null) => {
    setForm((prev) => {
      const list = prev.photos[fieldKey] ?? []
      const nextList = src
        ? list.map((p, i) => (i === index ? { ...p, src } : p))
        : list.filter((_, i) => i !== index)
      const next = { ...prev, photos: { ...prev.photos, [fieldKey]: nextList } }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handlePhotoPositionChangeAt = (fieldKey: string, index: number, partial: { x?: number; y?: number }) => {
    setForm((prev) => {
      const list = prev.photos[fieldKey] ?? []
      const nextList = list.map((p, i) => (i === index ? { ...p, ...partial } : p))
      const next = { ...prev, photos: { ...prev.photos, [fieldKey]: nextList } }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handleListItemAdd = (fieldKey: string) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: [...list, {}] } }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handleListItemChange = (fieldKey: string, index: number, subKey: string, val: string) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const nextList = list.map((item, i) => (i === index ? { ...item, [subKey]: val } : item))
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: nextList } }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  // Suwaki rozmiaru tytułu/pozostałego tekstu - sesyjne, celowo bez
  // persistDraft (jak grafiki/zdjęcia/listy - resetują się po odświeżeniu
  // strony).
  const handleTitleScaleChange = (value: number) => {
    setForm((prev) => ({ ...prev, titleScale: value }))
  }

  const handleTextScaleChange = (value: number) => {
    setForm((prev) => ({ ...prev, textScale: value }))
  }

  const handleScaleLinkedChange = (value: boolean) => {
    setForm((prev) => ({ ...prev, scaleLinked: value }))
  }

  const handleListItemRemove = (fieldKey: string, index: number) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: list.filter((_, i) => i !== index) } }
      persistDraft(next, selectedTemplateId, selectedScheme, selectedAccent)
      return next
    })
  }

  const handleSelectTemplate = (id: number) => {
    if (id === selectedTemplateId) return
    setSelectedTemplateId(id)
    const nextScheme = defaultSchemeFor(id, templates)
    setSelectedScheme(nextScheme)
    setSelectedAccent(undefined)
    persistDraft(form, id, nextScheme, undefined)
  }

  // Zmiana zakładki zostawia szablon, dane i kolorystykę - zmienia się tylko
  // komponent (plakat/baner) i lista formatów eksportu.
  const handleMediumChange = (next: Medium) => {
    if (next === medium) return
    setMedium(next)
    setExportFormat(DEFAULT_FORMAT[next])
    setExportNote(null)
  }

  const handleSelectScheme = (name: string) => {
    setSelectedScheme(name)
    // Nowy schemat może zawężać listę akcentów — „przypnij" niedozwolony.
    const posterKey = templates.find((t) => t.id === selectedTemplateId)?.poster_key ?? ''
    const accent = accentAllowed(posterKey, name, selectedAccent) ? selectedAccent : undefined
    setSelectedAccent(accent)
    persistDraft(form, selectedTemplateId, name, accent)
  }

  const handleSelectAccent = (accent: AccentName | undefined) => {
    setSelectedAccent(accent)
    persistDraft(form, selectedTemplateId, selectedScheme, accent)
  }

  // Przywraca pola tekstowe zapisanego wpisu historii do formularza. Zdjęcia
  // i logo nie są zapisywane w historii, więc wracają do stanu domyślnego.
  const handleRestoreHistoryEntry = (entry: HistoryRow) => {
    const next = {
      title: entry.title ?? '',
      subtitle: entry.subtitle ?? '',
      speaker: entry.speaker ?? '',
      event_date: entry.event_date ?? '',
      event_time: entry.event_time ?? '',
      location: entry.location ?? '',
      badge: '',
      badge2: '',
      body: '',
      visibility: {},
      graphics: [],
      showPkLogo: true,
      qrUrl: '',
      photos: {},
      lists: {},
      titleScale: 1,
      textScale: 1,
      scaleLinked: true,
    }
    setForm(next)
    const templateId = entry.template_id ?? selectedTemplateId
    setSelectedTemplateId(templateId)
    const { scheme, accent } = decodeScheme(entry.color_scheme)
    const nextScheme = scheme ?? defaultSchemeFor(templateId, templates)
    const posterKey = templates.find((t) => t.id === templateId)?.poster_key ?? ''
    const nextAccent = accentAllowed(posterKey, nextScheme, accent) ? accent : undefined
    setSelectedScheme(nextScheme)
    setSelectedAccent(nextAccent)
    persistDraft(next, templateId, nextScheme, nextAccent)
  }

  const handleDeleteHistoryEntry = async (id: number) => {
    if (!dbRef.current) return
    await deleteHistoryEntry(dbRef.current, id)
    setHistory(listHistory(dbRef.current))
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const selectedPoster = selectedTemplate ? posterRegistry[selectedTemplate.poster_key] : null
  const SelectedForm = selectedPoster?.Form

  const bugContext: BugContextInput = {
    templateName: selectedTemplate?.name,
    posterKey: selectedTemplate?.poster_key,
    schemeKey: encodeScheme(selectedScheme, selectedAccent),
    schemeLabel: selectedScheme ? SCHEME_LABELS[selectedScheme] : undefined,
    lang,
    form,
    appUrl: window.location.href,
    userAgent: navigator.userAgent,
    version: __APP_VERSION__,
  }

  const handleDownload = async () => {
    if (!selectedTemplate || !posterRef.current || !dbRef.current || exporting) return
    const basename = (form.title || 'plakat').trim().replace(/\s+/g, '_')
    setExporting(true)
    setExportNote(null)
    try {
      const { dpi } = await downloadPoster(posterRef.current, basename, { formatKey: exportFormat, orientation, fileType: effectiveFileType })
      if (dpi !== undefined && dpi < 300) setExportNote(`Zapisano w ${dpi} dpi — przeglądarka nie obsłużyła 300 dpi.`)
      await addHistoryEntry(dbRef.current, { ...form, template_id: selectedTemplateId, color_scheme: encodeScheme(selectedScheme, selectedAccent) })
      setHistory(listHistory(dbRef.current))
    } catch {
      setExportNote('Nie udało się wygenerować pliku. Spróbuj mniejszego formatu.')
    } finally {
      setExporting(false)
    }
  }

  const shell = 'mx-auto max-w-[720px] px-4 pt-8 pb-16 min-[900px]:max-w-[1240px]'
  // Panel: karta sekcji. W jednej kolumnie (mobile) rozdzielona odstępem
  // `mt-5`; od 900px grid ustawia odstępy przez `gap`, więc `mt` znika.
  const panel = 'mt-5 rounded-[14px] border border-border bg-surface p-5 min-[900px]:mt-0'
  const panelHeading = 'mb-3.5 text-base font-semibold uppercase tracking-[0.04em] text-muted'

  if (!ready) {
    return (
      <main className={shell}>
        <p>Ładowanie...</p>
      </main>
    )
  }

  return (
    <>
      <main className={shell}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[1.6rem] font-bold">Generator plakatów SKNM</h1>
          <LangToggle value={lang} onChange={setLang} />
        </div>

        {/* Do 900px sekcje płyną jedna pod drugą w kolejności DOM. Od 900px
            grid-template-areas robi dwie kolumny: lewa to szablon/formularz/
            akcje/historia, prawa to przypięty (sticky) podgląd. Nadmiar wysokości
            podglądu bierze ostatni wiersz (1fr) - inaczej zwinięte panele
            rozjeżdżałyby się, bo grid dzieli go równo między wiersze. */}
        <div className={`flex flex-col min-[900px]:mt-5 min-[900px]:grid min-[900px]:grid-cols-[1fr_460px] min-[900px]:items-start min-[900px]:gap-6 ${
          banner
            ? "min-[900px]:grid-rows-[auto_auto_auto_auto_1fr] min-[900px]:[grid-template-areas:'preview_preview''template_template''form_form''actions_actions''history_history']"
            : "min-[900px]:grid-rows-[auto_auto_auto_1fr] min-[900px]:[grid-template-areas:'template_preview''form_preview''actions_preview''history_preview']"
        }`}>
          <CollapsiblePanel
            id="template"
            title="1. Wybierz szablon"
            summary={selectedTemplate?.name}
            open={!collapsed.template}
            onToggle={() => togglePanel('template')}
            className={`${panel} min-[900px]:[grid-area:template]`}
          >
            <TemplateSelector
              templates={templates}
              selectedId={selectedTemplateId}
              onSelect={handleSelectTemplate}
              medium={medium}
              onMediumChange={handleMediumChange}
              bannerShape={shape}
              lang={lang}
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            id="form"
            title="2. Uzupełnij dane"
            open={!collapsed.form}
            onToggle={() => togglePanel('form')}
            className={`${panel} min-[900px]:[grid-area:form]`}
          >
            {SelectedForm && (
              <SelectedForm
                value={form}
                onFieldChange={handleFieldChange}
                onVisibilityChange={handleVisibilityChange}
                onGraphicsAdd={handleGraphicsAdd}
                onGraphicRemove={handleGraphicRemove}
                onGraphicMove={handleGraphicMove}
                onShowPkChange={handleShowPkChange}
                onQrUrlChange={handleQrUrlChange}
                onPhotoAdd={handlePhotoAdd}
                onPhotoChangeAt={handlePhotoChangeAt}
                onPhotoPositionChangeAt={handlePhotoPositionChangeAt}
                onListItemAdd={handleListItemAdd}
                onListItemChange={handleListItemChange}
                onListItemRemove={handleListItemRemove}
                onTitleScaleChange={handleTitleScaleChange}
                onTextScaleChange={handleTextScaleChange}
                onScaleLinkedChange={handleScaleLinkedChange}
              />
            )}
          </CollapsiblePanel>

          <section className={`${panel} flex flex-wrap items-center gap-3 min-[900px]:[grid-area:actions]`}>
            <select
              className="rounded-lg border border-field-border bg-field px-3.5 py-[11px] text-[0.9rem] text-fg"
              value={exportFormat}
              onChange={(e) => {
                setExportFormat(e.target.value)
                setExportNote(null)
              }}
              aria-label="Format eksportu"
            >
              {formatsFor(medium).map(([key, format]) => (
                <option key={key} value={key}>
                  {format.label}
                </option>
              ))}
            </select>
            {printFormat && (
              <>
                <SegmentedToggle value={orientation} onChange={setOrientation} options={ORIENTATION_OPTIONS} ariaLabel="Orientacja" />
                <SegmentedToggle value={fileType} onChange={setFileType} options={FILE_TYPE_OPTIONS} ariaLabel="Typ pliku" />
              </>
            )}
            <button
              type="button"
              className="cursor-pointer rounded-lg bg-accent px-[18px] py-[11px] text-[0.95rem] font-medium text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              onClick={handleDownload}
              disabled={exporting}
            >
              {exporting ? 'Generowanie…' : `Pobierz ${effectiveFileType.toUpperCase()}`}
            </button>
            {exportNote && (
              <p className="basis-full text-[0.85rem] text-muted" role="status">
                {exportNote}
              </p>
            )}
          </section>

          {/* Podgląd w pionie (A4/A3/A2) bywa wyższy niż okno - przypięty panel
              przewija się wtedy w sobie, żeby kolorystyka i akcent były osiągalne.
              Baner: panel idzie na górę, na całą szerokość, bez przypinania. */}
          <section
            className={`${panel} min-[900px]:[grid-area:preview] ${
              banner ? '' : 'min-[900px]:sticky min-[900px]:top-5 min-[900px]:max-h-[calc(100vh-2.5rem)] min-[900px]:overflow-y-auto'
            }`}
          >
            <h2 className={panelHeading}>Podgląd</h2>
            <div ref={previewBoxRef}>
              <PosterPreview
                posterRef={posterRef}
                Component={banner ? selectedPoster?.Banner : selectedPoster?.Component}
                data={form}
                scheme={selectedScheme}
                accent={selectedAccent}
                lang={lang}
                shape={shape}
                size={banner ? bannerPreviewSize : undefined}
              />
            </div>
            <SchemeSelector
              poster={selectedPoster}
              posterKey={selectedTemplate?.poster_key}
              selectedScheme={selectedScheme}
              onSelectScheme={handleSelectScheme}
              selectedAccent={selectedAccent}
              onSelectAccent={handleSelectAccent}
              lang={lang}
            />
          </section>

          <CollapsiblePanel
            id="history"
            title="Historia"
            open={!collapsed.history}
            onToggle={() => togglePanel('history')}
            className={`${panel} min-[900px]:[grid-area:history]`}
          >
            <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} lang={lang} />
          </CollapsiblePanel>
        </div>
        <SiteFooter onRequestClick={() => setTicket('request')} />
      </main>
      <FloatingReportButton onClick={() => setTicket('bug')} />
      <TicketDialog type={ticket} onClose={() => setTicket(null)} bugContext={bugContext} />
    </>
  )
}

export default App
