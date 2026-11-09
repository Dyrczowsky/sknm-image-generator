import type { FormProps } from '../types'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import type { FieldSpec } from './fields'
import { PosterForm } from './PosterForm'

// Lokalizacja z Enterem: dwulinijkowa nie wypycha logotypów pod stopkę.
const LOCATION: FieldSpec = { ...FIELDS.location, type: 'textarea', rows: 2 }

const GALA_FIELDS = [badgeField(DEFAULT_BADGE.gala.pl), FIELDS.title, FIELDS.subtitle, FIELDS.speaker, FIELDS.date, FIELDS.time, LOCATION]

// Formularz Gali - pełny zestaw pól wydarzenia, bez zdjęć.
export function FormGala(props: FormProps) {
  return <PosterForm {...props} fields={GALA_FIELDS} wideSubtitle />
}
