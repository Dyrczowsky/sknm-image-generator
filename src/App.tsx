import { useCallback, useEffect, useRef, useState } from 'react'
import type { Database } from 'sql.js'
import type { AccentName, FormValues, FormTextField, HistoryRow, PosterLang, TemplateRow } from './types'
import { getDb } from './db/client'
import { listTemplates } from './db/templates'
import { getDraft, saveDraft, parseVisibility } from './db/drafts'
import { addHistoryEntry, deleteHistoryEntry, listHistory } from './db/history'
import { posterRegistry } from './posters/registry'
import { schemesFor, SCHEME_LABELS, accentAllowed } from './posters/schemes'
import { MAX_GRAPHICS } from './posters/theme'
import { downloadPosterAsPng } from './posters/export'
import { EXPORT_FORMATS } from './posters/formats'
import { TemplateSelector } from './components/TemplateSelector'
import { SchemeSelector } from './components/SchemeSelector'
import { LangToggle } from './components/LangToggle'
import { PosterPreview } from './components/PosterPreview'
import { HistoryList } from './components/HistoryList'
import { TicketDialog } from './components/TicketDialog'
import { FloatingReportButton } from './components/FloatingReportButton'
import { SiteFooter } from './components/SiteFooter'
import { encodeScheme, decodeScheme } from './utils/colorScheme'
import type { BugContextInput } from './utils/issueUrl'

const LANG_STORAGE_KEY = 'sknm-poster-lang'

function loadStoredLang(): PosterLang {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'pl'
  } catch {
    return 'pl'
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
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [exportFormat, setExportFormat] = useState('square')
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
    if (!selectedTemplate || !posterRef.current || !dbRef.current) return
    const filename = `${form.title || 'plakat'}.png`.trim().replace(/\s+/g, '_')
    await downloadPosterAsPng(posterRef.current, filename, exportFormat)
    await addHistoryEntry(dbRef.current, { ...form, template_id: selectedTemplateId, color_scheme: encodeScheme(selectedScheme, selectedAccent) })
    setHistory(listHistory(dbRef.current))
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
            akcje/historia, prawa to przypięty (sticky) podgląd. */}
        <div className="flex flex-col min-[900px]:mt-5 min-[900px]:grid min-[900px]:grid-cols-[1fr_460px] min-[900px]:items-start min-[900px]:gap-6 min-[900px]:[grid-template-areas:'template_preview''form_preview''actions_preview''history_preview']">
          <section className={`${panel} min-[900px]:[grid-area:template]`}>
            <h2 className={panelHeading}>1. Wybierz szablon</h2>
            <TemplateSelector templates={templates} selectedId={selectedTemplateId} onSelect={handleSelectTemplate} lang={lang} />
          </section>

          <section className={`${panel} min-[900px]:[grid-area:form]`}>
            <h2 className={panelHeading}>2. Uzupełnij dane</h2>
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
          </section>

          <section className={`${panel} flex gap-3 min-[900px]:[grid-area:actions]`}>
            <select
              className="rounded-lg border border-field-border bg-field px-3.5 py-[11px] text-[0.9rem] text-fg"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              aria-label="Format eksportu"
            >
              {Object.entries(EXPORT_FORMATS).map(([key, format]) => (
                <option key={key} value={key}>
                  {format.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="cursor-pointer rounded-lg bg-accent px-[18px] py-[11px] text-[0.95rem] font-medium text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.98]"
              onClick={handleDownload}
            >
              Pobierz PNG
            </button>
          </section>

          <section className={`${panel} min-[900px]:sticky min-[900px]:top-5 min-[900px]:[grid-area:preview]`}>
            <h2 className={panelHeading}>Podgląd</h2>
            <PosterPreview posterRef={posterRef} Component={selectedPoster?.Component} data={form} scheme={selectedScheme} accent={selectedAccent} lang={lang} />
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

          <section className={`${panel} min-[900px]:[grid-area:history]`}>
            <h2 className={panelHeading}>Historia</h2>
            <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} lang={lang} />
          </section>
        </div>
        <SiteFooter onRequestClick={() => setTicket('request')} />
      </main>
      <FloatingReportButton onClick={() => setTicket('bug')} />
      <TicketDialog type={ticket} onClose={() => setTicket(null)} bugContext={bugContext} />
    </>
  )
}

export default App
