import type { FormProps } from '../types'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import { PosterForm } from './PosterForm'

const WYKLAD_FIELDS = [badgeField(DEFAULT_BADGE.wyklad.pl), FIELDS.title, FIELDS.subtitle, FIELDS.speaker, FIELDS.date, FIELDS.time, FIELDS.location]

// Formularz Wykładu - pełny zestaw pól wydarzenia, bez zdjęć.
export function FormWyklad(props: FormProps) {
  return <PosterForm {...props} fields={WYKLAD_FIELDS} />
}
