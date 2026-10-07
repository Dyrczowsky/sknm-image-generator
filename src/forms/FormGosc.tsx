import type { FormProps } from '../types'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import { PosterForm } from './PosterForm'

const GOSC_FIELDS = [badgeField(DEFAULT_BADGE.seminarium.pl), FIELDS.title, FIELDS.subtitle, FIELDS.speaker, FIELDS.date, FIELDS.time, FIELDS.location]

// Formularz Gościa - pełny zestaw pól wydarzenia + zdjęcie prelegenta.
export function FormGosc(props: FormProps) {
  return <PosterForm {...props} fields={GOSC_FIELDS} photoLabel="Zdjęcie prelegenta" />
}
