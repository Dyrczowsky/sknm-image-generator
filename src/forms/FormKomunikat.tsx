import type { FormProps } from '../types'
import { DEFAULT_BADGE } from '../posters/copy'
import { FIELDS, badgeField } from './fields'
import type { FieldSpec } from './fields'
import { PosterForm } from './PosterForm'

// Etykieta, nagłówek, akapit treści (`body`), podpis i opcjonalna data
// (bez godziny i lokalizacji).
const KOMUNIKAT_FIELDS: FieldSpec[] = [
  badgeField(DEFAULT_BADGE.komunikat.pl),
  { name: 'title', label: 'Nagłówek' },
  { name: 'body', label: 'Treść komunikatu', type: 'textarea' },
  { name: 'subtitle', label: 'Podpis / źródło (opcjonalnie)' },
  FIELDS.date,
]

export function FormKomunikat(props: FormProps) {
  return <PosterForm {...props} fields={KOMUNIKAT_FIELDS} />
}
