import type { FormProps } from '../types'
import { DEFAULT_BADGE, SOCIAL_HANDLE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import type { FieldSpec } from './fields'
import { PosterForm } from './PosterForm'

// Pole `speaker` to tu profil w stopce; puste pokazuje domyślny `SOCIAL_HANDLE`.
const PROFILE_FIELD: FieldSpec = { name: 'speaker', label: 'Profil w stopce (obok adresu strony)', placeholder: SOCIAL_HANDLE }

const REKRUTACJA_FIELDS = [badgeField(DEFAULT_BADGE.rekrutacja.pl), FIELDS.title, FIELDS.subtitle, PROFILE_FIELD, FIELDS.date, FIELDS.time, FIELDS.location]

// Formularz Rekrutacji - pełny zestaw pól wydarzenia, bez zdjęć.
export function FormRekrutacja(props: FormProps) {
  return <PosterForm {...props} fields={REKRUTACJA_FIELDS} />
}
