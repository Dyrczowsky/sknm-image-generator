import type { FormProps } from '../types'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import { PosterForm } from './PosterForm'

const REKRUTACJA_FIELDS = [badgeField(DEFAULT_BADGE.rekrutacja.pl), FIELDS.title, FIELDS.subtitle, FIELDS.speaker, FIELDS.date, FIELDS.time, FIELDS.location]

// Formularz Rekrutacji - pełny zestaw pól wydarzenia, bez zdjęć.
export function FormRekrutacja(props: FormProps) {
  return <PosterForm {...props} fields={REKRUTACJA_FIELDS} />
}
