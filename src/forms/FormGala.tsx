import type { FormProps } from '../types'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import { PosterForm } from './PosterForm'

const GALA_FIELDS = [badgeField(DEFAULT_BADGE.gala.pl), FIELDS.title, FIELDS.subtitle, FIELDS.speaker, FIELDS.date, FIELDS.time, FIELDS.location]

// Formularz Gali - pełny zestaw pól wydarzenia, bez zdjęć.
export function FormGala(props: FormProps) {
  return <PosterForm {...props} fields={GALA_FIELDS} />
}
