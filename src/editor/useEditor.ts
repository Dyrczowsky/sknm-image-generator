import { useEffect, useRef, useState } from 'react'
import type { Database } from 'sql.js'
import type { AccentName, FormValues, HistoryEntry, NewHistoryEntry, TemplateRow } from '../types'
import { getDb } from '../db/client'
import { getDraft, parseVisibility, saveDraft } from '../db/drafts'
import type { DraftInput } from '../db/drafts'
import { newHistoryEntry } from '../history/remoteHistory'
import { listTemplates } from '../db/templates'
import { decodeScheme, encodeScheme, fitColorsToLayout } from '../utils/colorScheme'
import type { ColorChoice } from '../utils/colorScheme'
import { EMPTY_FORM, formFromRow, textFieldsOf } from './formState'

const DRAFT_SAVE_DELAY_MS = 400

// Zapisuje draft do bazy po chwili bez zmian. Porównuje zserializowaną treść,
// więc zmiany stanu, których draft nie trzyma (grafiki, zdjęcia, suwaki), nie
// wywołują zapisu. Pierwszy przebieg po otwarciu bazy tylko zapamiętuje stan -
// to draft dopiero co z niej wczytany.
function useDraftAutosave(db: Database | null, draft: DraftInput) {
  const serialized = JSON.stringify(draft)
  const saved = useRef<string | null>(null)

  useEffect(() => {
    if (!db) return
    if (saved.current === null) saved.current = serialized
    if (saved.current === serialized) return
    const timeout = setTimeout(() => {
      saved.current = serialized
      void saveDraft(db, JSON.parse(serialized) as DraftInput)
    }, DRAFT_SAVE_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [db, serialized])
}

// Stan edytora: lokalna baza, szablony, dane formularza, wybrany szablon
// i kolorystyka. Dane formularza są globalne i przeżywają zmianę szablonu.
// Wspólna historia mieszka osobno (src/history/).
export function useEditor() {
  const [db, setDb] = useState<Database | null>(null)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [colors, setColors] = useState<ColorChoice>({ scheme: undefined, accent: undefined })
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)

  const posterKeyOf = (id: number | null) => templates.find((t) => t.id === id)?.poster_key
  const template = templates.find((t) => t.id === templateId)
  const colorScheme = encodeScheme(colors.scheme, colors.accent)

  // Start: otwarcie bazy i odtworzenie ostatniego draftu.
  useEffect(() => {
    let cancelled = false
    void getDb().then((openedDb) => {
      if (cancelled) return
      const loadedTemplates = listTemplates(openedDb)
      const draft = getDraft(openedDb)
      const initialId = draft?.template_id ?? loadedTemplates[0]?.id ?? null
      const initialKey = loadedTemplates.find((t) => t.id === initialId)?.poster_key

      setTemplates(loadedTemplates)
      setTemplateId(initialId)
      setColors(fitColorsToLayout(initialKey, decodeScheme(draft?.color_scheme)))
      if (draft) setForm({ ...formFromRow(draft), visibility: parseVisibility(draft.visibility) })
      setDb(openedDb)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useDraftAutosave(db, {
    ...textFieldsOf(form),
    visibility: form.visibility,
    template_id: templateId,
    color_scheme: colorScheme ?? null,
  })

  // Nowy szablon dostaje swoją domyślną kolorystykę.
  const selectTemplate = (id: number) => {
    if (id === templateId) return
    setTemplateId(id)
    setColors(fitColorsToLayout(posterKeyOf(id)))
  }

  // Nowy schemat może zawężać listę akcentów - niedozwolony jest odpinany.
  const selectScheme = (scheme: string) => {
    setColors(fitColorsToLayout(template?.poster_key, { scheme, accent: colors.accent }))
  }

  const selectAccent = (accent: AccentName | undefined) => {
    setColors({ ...colors, accent })
  }

  // Przywraca pola tekstowe, szablon i kolorystykę wpisu historii. Zdjęć
  // i grafik historia nie trzyma, więc wracają do stanu domyślnego. Wpis
  // z layoutem, którego lokalnie nie ma, zostawia bieżący szablon.
  const restoreHistoryEntry = (entry: HistoryEntry) => {
    const id = templates.find((t) => t.poster_key === entry.poster_key)?.id ?? templateId
    setForm(formFromRow(entry))
    setTemplateId(id)
    setColors(fitColorsToLayout(posterKeyOf(id), decodeScheme(entry.color_scheme)))
  }

  // Bieżący stan jako wpis historii; `null`, gdy nie ma wybranego szablonu.
  const exportSnapshot = (): NewHistoryEntry | null =>
    template ? newHistoryEntry(template.poster_key, form, colorScheme) : null

  return {
    ready: db !== null,
    templates,
    template,
    form,
    updateForm: setForm,
    colors,
    colorScheme,
    selectTemplate,
    selectScheme,
    selectAccent,
    restoreHistoryEntry,
    exportSnapshot,
  }
}
