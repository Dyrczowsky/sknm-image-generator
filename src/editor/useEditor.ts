import { useEffect, useState } from 'react'
import type { AccentName, FormValues, TemplateRow } from '../types'
import { getDb } from '../db/client'
import { listTemplates } from '../db/templates'
import { decodeScheme, encodeScheme, fitColorsToLayout } from '../utils/colorScheme'
import type { ColorChoice } from '../utils/colorScheme'
import { EMPTY_FORM } from './formState'

// To, co edytor przyjmuje przy wczytaniu snapshotu (start, projekt, historia).
export interface EditorContent {
  posterKey: string
  colorScheme: string | null
  form: FormValues
}

// Stan edytora: szablony z lokalnej bazy, dane formularza, wybrany layout
// i kolorystyka. Dane formularza są globalne i przeżywają zmianę szablonu.
// Zapisem i odtwarzaniem stanu zajmuje się kopia robocza (src/workspace/).
export function useEditor() {
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null)
  // Klucz layoutu, nie lokalne `templates.id` - te różnią się między przeglądarkami.
  const [posterKey, setPosterKey] = useState<string | null>(null)
  const [colors, setColors] = useState<ColorChoice>({ scheme: undefined, accent: undefined })
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)

  const list = templates ?? []
  // Layout, którego lokalnie nie ma (albo jeszcze żaden) → pierwszy szablon.
  const template = list.find((t) => t.poster_key === posterKey) ?? list[0]
  const colorScheme = encodeScheme(colors.scheme, colors.accent)

  // Start: otwarcie bazy z szablonami.
  useEffect(() => {
    let cancelled = false
    void getDb().then((db) => {
      if (!cancelled) setTemplates(listTemplates(db))
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Nowy szablon dostaje swoją domyślną kolorystykę.
  const selectTemplate = (id: number) => {
    const next = list.find((t) => t.id === id)
    if (!next || next.id === template?.id) return
    setPosterKey(next.poster_key)
    setColors(fitColorsToLayout(next.poster_key))
  }

  // Nowy schemat może zawężać listę akcentów - niedozwolony jest odpinany.
  const selectScheme = (scheme: string) => {
    setColors(fitColorsToLayout(template?.poster_key, { scheme, accent: colors.accent }))
  }

  const selectAccent = (accent: AccentName | undefined) => {
    setColors({ ...colors, accent })
  }

  // Wczytuje cały stan naraz. W odróżnieniu od `selectTemplate` nie resetuje
  // kolorystyki: zapisana zostaje, o ile layout ją dopuszcza. Nie zależy od
  // listy szablonów, więc działa też, zanim ta się wczyta.
  const applyState = (content: EditorContent) => {
    setPosterKey(content.posterKey)
    setColors(fitColorsToLayout(content.posterKey, decodeScheme(content.colorScheme)))
    setForm(content.form)
  }

  return {
    ready: templates !== null,
    templates: list,
    template,
    form,
    updateForm: setForm,
    colors,
    colorScheme,
    selectTemplate,
    selectScheme,
    selectAccent,
    applyState,
  }
}

export type Editor = ReturnType<typeof useEditor>
