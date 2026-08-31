import { useCallback, useEffect, useRef, useState } from 'react'
import type { Database } from 'sql.js'
import type { FormValues, FormTextField, FormColorField, HistoryRow, TemplateRow } from './types'
import { getDb } from './db/client'
import { listTemplates } from './db/templates'
import { getDraft, saveDraft, parseVisibility } from './db/drafts'
import { addHistoryEntry, deleteHistoryEntry, listHistory } from './db/history'
import { posterRegistry } from './posters/registry'
import { schemesFor, SCHEME_LABELS } from './posters/schemes'
import { MAX_GRAPHICS } from './posters/theme'
import { downloadPosterAsPng, EXPORT_FORMATS } from './posters/export'
import { TemplateSelector } from './components/TemplateSelector'
import { SchemeSelector } from './components/SchemeSelector'
import { PosterPreview } from './components/PosterPreview'
import { HistoryList } from './components/HistoryList'
import { TicketDialog } from './components/TicketDialog'
import { FloatingReportButton } from './components/FloatingReportButton'
import { SiteFooter } from './components/SiteFooter'
import type { BugContextInput } from './utils/issueUrl'

const EMPTY_FORM: FormValues = {
  title: '',
  subtitle: '',
  speaker: '',
  event_date: '',
  event_time: '',
  location: '',
  badge: '',
  badge2: '',
  visibility: {},
  graphics: [],
  showPkLogo: true,
  qrUrl: '',
  colors: {},
  photos: {},
  lists: {},
}

// Domyślny schemat kolorów danego layoutu = pierwszy schemat z `schemes.ts`
// (`undefined` tylko dla layoutu z jednym schematem — żaden obecnie taki nie
// jest — resolveScheme użyje wtedy bloku bazowego).
function defaultSchemeFor(templateId: number | null, templates: TemplateRow[]): string | undefined {
  const tpl = templates.find((t) => t.id === templateId)
  const list = tpl ? schemesFor(tpl.poster_key) : []
  return list.length > 1 ? list[0] : undefined
}

function App() {
  const dbRef = useRef<Database | null>(null)
  const posterRef = useRef<HTMLDivElement | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [ready, setReady] = useState(false)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedScheme, setSelectedScheme] = useState<string | undefined>(undefined)
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
          visibility: parseVisibility(draft.visibility),
          graphics: [],
          showPkLogo: true,
          qrUrl: '',
          colors: {},
          photos: {},
          lists: {},
        })
      }
      setSelectedTemplateId(initialTemplateId)
      setSelectedScheme(draft?.color_scheme ?? defaultSchemeFor(initialTemplateId, tpls))

      setHistory(listHistory(db))
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const persistDraft = useCallback((nextForm: FormValues, templateId: number | null, schemeName: string | undefined) => {
    const db = dbRef.current
    if (!db) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(db, { ...nextForm, template_id: templateId, color_scheme: schemeName ?? null })
    }, 400)
  }, [])

  const handleFieldChange = (name: FormTextField, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      persistDraft(next, selectedTemplateId, selectedScheme)
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
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handleGraphicsAdd = (srcs: string[]) => {
    setForm((prev) => {
      const next = { ...prev, graphics: [...prev.graphics, ...srcs].slice(0, MAX_GRAPHICS) }
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handleGraphicRemove = (index: number) => {
    setForm((prev) => {
      const next = { ...prev, graphics: prev.graphics.filter((_, i) => i !== index) }
      persistDraft(next, selectedTemplateId, selectedScheme)
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
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handleShowPkChange = (value: boolean) => {
    setForm((prev) => {
      const next = { ...prev, showPkLogo: value }
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handleQrUrlChange = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, qrUrl: value }
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  // Nadpisanie koloru per szablon; pusty string = usunięcie nadpisania.
  const handleColorChange = (name: FormColorField, value: string) => {
    setForm((prev) => {
      const nextColors = { ...prev.colors }
      if (value) nextColors[name] = value
      else delete nextColors[name]
      const next = { ...prev, colors: nextColors }
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  // Galeria zdjęć: dodanie nowego pliku zawsze dokłada kolejny wpis do listy.
  const handlePhotoAdd = (fieldKey: string, src: string | null) => {
    if (!src) return
    setForm((prev) => {
      const list = prev.photos[fieldKey] ?? []
      const next = { ...prev, photos: { ...prev.photos, [fieldKey]: [...list, { src, x: 50, y: 50 }] } }
      persistDraft(next, selectedTemplateId, selectedScheme)
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
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handlePhotoPositionChangeAt = (fieldKey: string, index: number, partial: { x?: number; y?: number }) => {
    setForm((prev) => {
      const list = prev.photos[fieldKey] ?? []
      const nextList = list.map((p, i) => (i === index ? { ...p, ...partial } : p))
      const next = { ...prev, photos: { ...prev.photos, [fieldKey]: nextList } }
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handleListItemAdd = (fieldKey: string) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: [...list, {}] } }
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handleListItemChange = (fieldKey: string, index: number, subKey: string, val: string) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const nextList = list.map((item, i) => (i === index ? { ...item, [subKey]: val } : item))
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: nextList } }
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handleListItemRemove = (fieldKey: string, index: number) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: list.filter((_, i) => i !== index) } }
      persistDraft(next, selectedTemplateId, selectedScheme)
      return next
    })
  }

  const handleSelectTemplate = (id: number) => {
    if (id === selectedTemplateId) return
    setSelectedTemplateId(id)
    const nextScheme = defaultSchemeFor(id, templates)
    setSelectedScheme(nextScheme)
    persistDraft(form, id, nextScheme)
  }

  const handleSelectScheme = (name: string) => {
    setSelectedScheme(name)
    persistDraft(form, selectedTemplateId, name)
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
      visibility: {},
      graphics: [],
      showPkLogo: true,
      qrUrl: '',
      colors: {},
      photos: {},
      lists: {},
    }
    setForm(next)
    const templateId = entry.template_id ?? selectedTemplateId
    setSelectedTemplateId(templateId)
    const nextScheme = entry.color_scheme ?? defaultSchemeFor(templateId, templates)
    setSelectedScheme(nextScheme)
    persistDraft(next, templateId, nextScheme)
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
    schemeKey: selectedScheme,
    schemeLabel: selectedScheme ? SCHEME_LABELS[selectedScheme] : undefined,
    form,
    appUrl: window.location.href,
    userAgent: navigator.userAgent,
    version: __APP_VERSION__,
  }

  const handleDownload = async () => {
    if (!selectedTemplate || !posterRef.current || !dbRef.current) return
    const filename = `${form.title || 'plakat'}.png`.trim().replace(/\s+/g, '_')
    await downloadPosterAsPng(posterRef.current, filename, exportFormat)
    await addHistoryEntry(dbRef.current, { ...form, template_id: selectedTemplateId, color_scheme: selectedScheme })
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
        <h1 className="mb-2 text-[1.6rem] font-bold">Generator plakatów SKNM</h1>

        {/* Do 900px sekcje płyną jedna pod drugą w kolejności DOM. Od 900px
            grid-template-areas robi dwie kolumny: lewa to szablon/formularz/
            akcje/historia, prawa to przypięty (sticky) podgląd. */}
        <div className="flex flex-col min-[900px]:mt-5 min-[900px]:grid min-[900px]:grid-cols-[1fr_460px] min-[900px]:items-start min-[900px]:gap-6 min-[900px]:[grid-template-areas:'template_preview''form_preview''actions_preview''history_preview']">
          <section className={`${panel} min-[900px]:[grid-area:template]`}>
            <h2 className={panelHeading}>1. Wybierz szablon</h2>
            <TemplateSelector templates={templates} selectedId={selectedTemplateId} onSelect={handleSelectTemplate} />
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
                onColorChange={handleColorChange}
                onPhotoAdd={handlePhotoAdd}
                onPhotoChangeAt={handlePhotoChangeAt}
                onPhotoPositionChangeAt={handlePhotoPositionChangeAt}
                onListItemAdd={handleListItemAdd}
                onListItemChange={handleListItemChange}
                onListItemRemove={handleListItemRemove}
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
            <PosterPreview posterRef={posterRef} Component={selectedPoster?.Component} data={form} scheme={selectedScheme} />
            <SchemeSelector poster={selectedPoster} posterKey={selectedTemplate?.poster_key} selectedScheme={selectedScheme} onSelectScheme={handleSelectScheme} />
          </section>

          <section className={`${panel} min-[900px]:[grid-area:history]`}>
            <h2 className={panelHeading}>Historia</h2>
            <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} />
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
