import type { FormProps } from '../types'
import { FIELDS } from './fields'
import { PosterForm } from './PosterForm'

export const DATA_PHOTO_LABEL = 'Zdjęcie z wydarzenia'

export const DATA_FIELDS = [FIELDS.title, FIELDS.subtitle, FIELDS.speaker, FIELDS.date, FIELDS.time, FIELDS.location]

// Formularz Daty - pola wydarzenia bez plakietki + zdjęcie z wydarzenia.
export function FormData(props: FormProps) {
  return <PosterForm {...props} fields={DATA_FIELDS} photoLabel={DATA_PHOTO_LABEL} wideSubtitle />
}
