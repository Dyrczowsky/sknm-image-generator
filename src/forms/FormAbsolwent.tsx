import type { FormProps } from '../types'
import { DEFAULT_BADGE, SITE_URL } from '../posters/copy'
import { PLACEHOLDERS } from '../posters/fallback'
import { badgeField } from './fields'
import type { FieldSpec } from './fields'
import { PosterForm } from './PosterForm'

export const ABSOLWENT_PHOTO_LABEL = 'Zdjęcie absolwenta'

export const ABSOLWENT_FIELDS: FieldSpec[] = [
  badgeField(DEFAULT_BADGE.absolwent.pl),
  { name: 'title', label: 'Imię i nazwisko', type: 'textarea', rows: 2, placeholder: PLACEHOLDERS.absolwentName },
  { name: 'subtitle', label: 'Kim jest dziś', type: 'textarea', rows: 2, placeholder: PLACEHOLDERS.absolwentRole },
  { name: 'body', label: 'Opis', type: 'textarea', rows: 6, placeholder: PLACEHOLDERS.absolwentBody },
  { name: 'badge2', label: 'Linia na dole', placeholder: SITE_URL },
]

// Formularz Absolwenta (seria jubileuszowa): kto, czym zajmuje się dziś, kilka zdań i portret.
export function FormAbsolwent(props: FormProps) {
  return <PosterForm {...props} fields={ABSOLWENT_FIELDS} photoLabel={ABSOLWENT_PHOTO_LABEL} />
}
