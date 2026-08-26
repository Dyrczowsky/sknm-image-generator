import { useCallback, useEffect, useRef, useState } from 'react'
import { getDb } from './db/client'
import { listTemplates } from './db/templates'
import { getDraft, saveDraft } from './db/drafts'
import { addHistoryEntry, deleteHistoryEntry, listHistory } from './db/history'
import { posterRegistry } from './posters/registry'
import { downloadPosterAsPng, EXPORT_FORMATS } from './posters/export'
import { TemplateSelector } from './components/TemplateSelector'
import { PosterPreview } from './components/PosterPreview'
import { HistoryList } from './components/HistoryList'

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  speaker: '',
  event_date: '',
  event_time: '',
  location: '',
  logos: {},
  photos: {},
  lists: {},
}

function App() {
  const dbRef = useRef(null)
  const posterRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [history, setHistory] = useState([])
  const [exportFormat, setExportFormat] = useState('square')

  useEffect(() => {
    let cancelled = false
    getDb().then((db) => {
      if (cancelled) return
      dbRef.current = db
      const tpls = listTemplates(db)
      setTemplates(tpls)

      const draft = getDraft(db)
      if (draft) {
        setForm({
          title: draft.title ?? '',
          subtitle: draft.subtitle ?? '',
          speaker: draft.speaker ?? '',
          event_date: draft.event_date ?? '',
          event_time: draft.event_time ?? '',
          location: draft.location ?? '',
          logos: {},
          photos: {},
          lists: {},
        })
        setSelectedTemplateId(draft.template_id ?? tpls[0]?.id ?? null)
      } else {
        setSelectedTemplateId(tpls[0]?.id ?? null)
      }

      setHistory(listHistory(db))
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const persistDraft = useCallback((nextForm, templateId) => {
    if (!dbRef.current) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(dbRef.current, { ...nextForm, template_id: templateId })
    }, 400)
  }, [])

  const handleFieldChange = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handleLogoChange = (slotKey, src) => {
    setForm((prev) => {
      const current = prev.logos[slotKey] ?? { enabled: true, src: null }
      const next = { ...prev, logos: { ...prev.logos, [slotKey]: { ...current, src, enabled: true } } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handleLogoEnabledChange = (slotKey, checked) => {
    setForm((prev) => {
      const current = prev.logos[slotKey] ?? { enabled: true, src: null }
      const next = { ...prev, logos: { ...prev.logos, [slotKey]: { ...current, enabled: checked } } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  // Galeria zdjęć: dodanie nowego pliku zawsze dokłada kolejny wpis do listy.
  const handlePhotoAdd = (fieldKey, src) => {
    if (!src) return
    setForm((prev) => {
      const list = prev.photos[fieldKey] ?? []
      const next = { ...prev, photos: { ...prev.photos, [fieldKey]: [...list, { src, x: 50, y: 50 }] } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  // Zmiana pliku pod istniejącym wpisem galerii; `null` usuwa ten wpis.
  const handlePhotoChangeAt = (fieldKey, index, src) => {
    setForm((prev) => {
      const list = prev.photos[fieldKey] ?? []
      const nextList = src
        ? list.map((p, i) => (i === index ? { ...p, src } : p))
        : list.filter((_, i) => i !== index)
      const next = { ...prev, photos: { ...prev.photos, [fieldKey]: nextList } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handlePhotoPositionChangeAt = (fieldKey, index, partial) => {
    setForm((prev) => {
      const list = prev.photos[fieldKey] ?? []
      const nextList = list.map((p, i) => (i === index ? { ...p, ...partial } : p))
      const next = { ...prev, photos: { ...prev.photos, [fieldKey]: nextList } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handleListItemAdd = (fieldKey) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: [...list, {}] } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handleListItemChange = (fieldKey, index, subKey, val) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const nextList = list.map((item, i) => (i === index ? { ...item, [subKey]: val } : item))
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: nextList } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handleListItemRemove = (fieldKey, index) => {
    setForm((prev) => {
      const list = prev.lists[fieldKey] ?? []
      const next = { ...prev, lists: { ...prev.lists, [fieldKey]: list.filter((_, i) => i !== index) } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handleSelectTemplate = (id) => {
    setSelectedTemplateId(id)
    persistDraft(form, id)
  }

  // Przywraca pola tekstowe zapisanego wpisu historii do formularza. Zdjęcia
  // i logo nie są zapisywane w historii, więc wracają do stanu domyślnego.
  const handleRestoreHistoryEntry = (entry) => {
    const next = {
      title: entry.title ?? '',
      subtitle: entry.subtitle ?? '',
      speaker: entry.speaker ?? '',
      event_date: entry.event_date ?? '',
      event_time: entry.event_time ?? '',
      location: entry.location ?? '',
      logos: {},
      photos: {},
      lists: {},
    }
    setForm(next)
    const templateId = entry.template_id ?? selectedTemplateId
    setSelectedTemplateId(templateId)
    persistDraft(next, templateId)
  }

  const handleDeleteHistoryEntry = async (id) => {
    if (!dbRef.current) return
    await deleteHistoryEntry(dbRef.current, id)
    setHistory(listHistory(dbRef.current))
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const selectedPoster = selectedTemplate ? posterRegistry[selectedTemplate.poster_key] : null
  const SelectedForm = selectedPoster?.Form

  const handleDownload = async () => {
    if (!selectedTemplate || !posterRef.current || !dbRef.current) return
    const filename = `${form.title || 'plakat'}.png`.trim().replace(/\s+/g, '_')
    await downloadPosterAsPng(posterRef.current, filename, exportFormat)
    await addHistoryEntry(dbRef.current, { ...form, template_id: selectedTemplateId })
    setHistory(listHistory(dbRef.current))
  }

  if (!ready) {
    return (
      <main className="app-shell">
        <p>Ładowanie...</p>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <h1>Generator plakatów SKNM</h1>

      <section className="panel">
        <h2>1. Wybierz szablon</h2>
        <TemplateSelector
          templates={templates}
          selectedId={selectedTemplateId}
          onSelect={handleSelectTemplate}
        />
      </section>

      <section className="panel">
        <h2>2. Uzupełnij dane</h2>
        {SelectedForm && (
          <SelectedForm
            value={form}
            onFieldChange={handleFieldChange}
            onLogoChange={handleLogoChange}
            onLogoEnabledChange={handleLogoEnabledChange}
            onPhotoAdd={handlePhotoAdd}
            onPhotoChangeAt={handlePhotoChangeAt}
            onPhotoPositionChangeAt={handlePhotoPositionChangeAt}
            onListItemAdd={handleListItemAdd}
            onListItemChange={handleListItemChange}
            onListItemRemove={handleListItemRemove}
          />
        )}
      </section>

      <section className="panel actions">
        <select
          className="export-format-select"
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
        <button type="button" onClick={handleDownload}>
          Pobierz PNG
        </button>
      </section>

      <section className="panel">
        <h2>Podgląd</h2>
        <PosterPreview posterRef={posterRef} Component={selectedPoster?.Component} data={form} />
      </section>

      <section className="panel">
        <h2>Historia</h2>
        <HistoryList entries={history} onRestore={handleRestoreHistoryEntry} onDelete={handleDeleteHistoryEntry} />
      </section>
    </main>
  )
}

export default App
