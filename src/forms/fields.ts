import type { FormTextField } from '../types'

// Opis jednego pola tekstowego formularza layoutu. Bez `placeholder` pole
// pokazuje wartość przykładową z `PLACEHOLDERS` (o ile dane pole ją ma).
export interface FieldSpec {
  name: FormTextField
  label: string
  // `textarea` - wieloliniowe pole do dłuższych akapitów.
  type?: 'text' | 'date' | 'time' | 'textarea'
  placeholder?: string
}

// Pola o tym samym podpisie w większości layoutów. Layout z innym podpisem
// (np. „Nagłówek" zamiast „Tytuł") wpisuje własny `FieldSpec`.
export const FIELDS = {
  title: { name: 'title', label: 'Tytuł' },
  subtitle: { name: 'subtitle', label: 'Opis / podtytuł' },
  speaker: { name: 'speaker', label: 'Prelegent / organizator' },
  date: { name: 'event_date', label: 'Data', type: 'date' },
  time: { name: 'event_time', label: 'Godzina', type: 'time' },
  location: { name: 'location', label: 'Lokalizacja' },
} satisfies Record<string, FieldSpec>

// Plakietka: placeholder to domyślna treść, którą plakat pokaże przy pustym polu.
export const badgeField = (placeholder: string, label = 'Etykieta'): FieldSpec => ({ name: 'badge', label, placeholder })
