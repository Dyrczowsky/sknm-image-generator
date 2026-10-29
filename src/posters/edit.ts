import { createContext, useContext } from 'react'
import type { Context } from 'react'
import { setField, setListItemField } from '../editor/formState'
import { FORM_TEXT_FIELDS } from '../types'
import type { FormTextField, FormUpdate } from '../types'

// Edycja tekstu wprost na podglądzie plakatu/banera. Bez providera (miniatury,
// historia, lista projektów, eksport) plakat jest statyczny.
export interface PosterEdit {
  editable: boolean
  // `path`: nazwa pola formularza (`title`) albo pozycja listy (`lists.agenda.2.title`).
  onText: (path: string, value: string) => void
}

export const READ_ONLY_POSTER_EDIT: PosterEdit = {
  editable: false,
  onText: () => {},
}

export const PosterEditContext: Context<PosterEdit> = createContext<PosterEdit>(READ_ONLY_POSTER_EDIT)

export function usePosterEdit(): PosterEdit {
  return useContext(PosterEditContext)
}

const isTextField = (name: string): name is FormTextField => (FORM_TEXT_FIELDS as readonly string[]).includes(name)

// Zmiana formularza dla ścieżki z `PosterText`. Nieznana ścieżka nie zmienia nic.
export function setFormPath(path: string, value: string): FormUpdate {
  const [head, key, index, ...rest] = path.split('.')
  if (head === 'lists' && key && /^\d+$/.test(index ?? '') && rest.length) {
    return setListItemField(key, Number(index), rest.join('.'), value)
  }
  if (isTextField(path)) return setField(path, value)
  return (form) => form
}
