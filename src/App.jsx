import { useCallback, useEffect, useRef, useState } from 'react'
import { getDb } from './db/client'
import { listTemplates } from './db/templates'
import { getDraft, saveDraft } from './db/drafts'
import { addHistoryEntry, listHistory } from './db/history'
import { posterRegistry } from './posters/registry'
import { downloadPosterAsPng } from './posters/export'
import { TemplateSelector } from './components/TemplateSelector'
import { PosterForm } from './components/PosterForm'
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

  const handlePhotoChange = (slotKey, src) => {
    setForm((prev) => {
      const current = prev.photos[slotKey] ?? { enabled: true, src: null, x: 50, y: 50 }
      const next = {
        ...prev,
        photos: { ...prev.photos, [slotKey]: src ? { enabled: true, src, x: 50, y: 50 } : { ...current, src: null } },
      }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handlePhotoPositionChange = (slotKey, partial) => {
    setForm((prev) => {
      const current = prev.photos[slotKey] ?? { enabled: true, src: null, x: 50, y: 50 }
      const next = { ...prev, photos: { ...prev.photos, [slotKey]: { ...current, ...partial } } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handlePhotoEnabledChange = (slotKey, checked) => {
    setForm((prev) => {
      const current = prev.photos[slotKey] ?? { enabled: true, src: null, x: 50, y: 50 }
      const next = { ...prev, photos: { ...prev.photos, [slotKey]: { ...current, enabled: checked } } }
      persistDraft(next, selectedTemplateId)
      return next
    })
  }

  const handleSelectTemplate = (id) => {
    setSelectedTemplateId(id)
    persistDraft(form, id)
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const selectedPoster = selectedTemplate ? posterRegistry[selectedTemplate.poster_key] : null

  const handleDownload = async () => {
    if (!selectedTemplate || !posterRef.current || !dbRef.current) return
    const filename = `${form.title || 'plakat'}.png`.trim().replace(/\s+/g, '_')
    await downloadPosterAsPng(posterRef.current, filename)
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
        <PosterForm
          fields={selectedPoster?.fields ?? []}
          value={form}
          onFieldChange={handleFieldChange}
          onLogoChange={handleLogoChange}
          onLogoEnabledChange={handleLogoEnabledChange}
          onPhotoChange={handlePhotoChange}
          onPhotoEnabledChange={handlePhotoEnabledChange}
          onPhotoPositionChange={handlePhotoPositionChange}
        />
      </section>

      <section className="panel actions">
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
        <HistoryList entries={history} />
      </section>
    </main>
  )
}

export default App
