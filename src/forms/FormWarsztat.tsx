import type { FormProps } from '../types'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import { PosterForm } from './PosterForm'

const WARSZTAT_FIELDS = [badgeField(DEFAULT_BADGE.warsztat.pl), FIELDS.title, FIELDS.subtitle, FIELDS.speaker, FIELDS.date, FIELDS.time, FIELDS.location]

// Formularz Warsztatu - pełny zestaw pól wydarzenia + zdjęcie z warsztatów.
export function FormWarsztat(props: FormProps) {
  return <PosterForm {...props} fields={WARSZTAT_FIELDS} photoLabel="Zdjęcie z warsztatów" />
}
