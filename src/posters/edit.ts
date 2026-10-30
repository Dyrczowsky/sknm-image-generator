import { createContext, useContext } from 'react'
import type { Context } from 'react'
import { setField, setListItemField } from '../editor/formState'
import { FORM_TEXT_FIELDS } from '../types'
import type { FormTextField, FormUpdate, ListItem } from '../types'

// Edycja tekstu wprost na podglądzie plakatu/banera. Bez providera (miniatury,
// historia, lista projektów, eksport) plakat jest statyczny.
export interface PosterEdit {
  editable: boolean
  // `path`: nazwa pola formularza (`title`) albo pozycja listy (`lists.agenda.2.title`).
  // `seed`: lista, którą szablon rysuje, gdy w formularzu jej brak (np. program domyślny).
  onText: (path: string, value: string, seed?: ListItem[]) => void
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

// Zmiana formularza dla ścieżki z `PosterText`. Pusta lista w formularzu, a
// szablon rysuje domyślną (`seed`): najpierw kopia domyślnej, potem zmiana -
// inaczej edycja punktu domyślnego programu by przepadła. Nieznana ścieżka
// albo pozycja spoza listy nie zmienia nic (ten sam obiekt).
export function setFormPath(path: string, value: string, seed?: ListItem[]): FormUpdate {
  const [head, key, index, ...rest] = path.split('.')
  if (head === 'lists' && key && /^\d+$/.test(index ?? '') && rest.length) {
    const i = Number(index)
    const name = rest.join('.')
    return (form) => {
      const stored = form.lists[key] ?? []
      const items = stored.length ? stored : (seed ?? []).map((item) => ({ ...item }))
      if (i >= items.length) return form
      return setListItemField(key, i, name, value)({ ...form, lists: { ...form.lists, [key]: items } })
    }
  }
  if (isTextField(path)) return setField(path, value)
  return (form) => form
}
