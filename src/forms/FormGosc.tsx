import type { FormProps } from '../types'
import { DEFAULT_BADGE, FREE_ENTRY } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import type { FieldSpec } from './fields'
import { PosterForm } from './PosterForm'

// Dolna linia plakatu („Wstęp wolny · adres strony") - własny tekst albo ukrycie.
const GOSC_FIELDS: FieldSpec[] = [
  badgeField(DEFAULT_BADGE.seminarium.pl),
  FIELDS.title,
  FIELDS.subtitle,
  FIELDS.speaker,
  FIELDS.date,
  FIELDS.time,
  FIELDS.location,
  { name: 'badge2', label: 'Linia na dole', placeholder: FREE_ENTRY.pl },
]

// Formularz Gościa - pełny zestaw pól wydarzenia + zdjęcie prelegenta.
export function FormGosc(props: FormProps) {
  return <PosterForm {...props} fields={GOSC_FIELDS} photoLabel="Zdjęcie prelegenta" />
}
