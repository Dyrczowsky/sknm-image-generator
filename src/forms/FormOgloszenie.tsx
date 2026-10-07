import type { FormProps } from '../types'
import type { FieldSpec } from './fields'
import { PosterForm } from './PosterForm'

// Krótki zestaw pól (bez daty, godziny i lokalizacji) - do cytatów,
// komunikatów i podziękowań.
const OGLOSZENIE_FIELDS: FieldSpec[] = [
  { name: 'title', label: 'Treść ogłoszenia / cytatu' },
  { name: 'subtitle', label: 'Autor / podpis (opcjonalnie)' },
]

export function FormOgloszenie(props: FormProps) {
  return <PosterForm {...props} fields={OGLOSZENIE_FIELDS} />
}
