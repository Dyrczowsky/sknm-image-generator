import type { ReactNode } from 'react'
import type { FormProps } from '../types'
import type { FieldSpec } from './fields'
import { FormField } from './FormField'
import { FormGroup, PANEL_STACK } from './FormGroup'
import { PhotoGalleryField } from './PhotoGalleryField'
import { QrField } from './QrField'

interface PosterFormProps extends FormProps {
  fields: FieldSpec[]
  // Podpis galerii zdjęć. Brak = layout nie ma miejsca na zdjęcia.
  photoLabel?: string
  // Grupy własne layoutu (np. „Program" konferencji) - między tekstami a zdjęciami.
  children?: ReactNode
}

// Treść layoutu (zakładka „Treść"): grupy „Teksty", własne grupy layoutu,
// „Zdjęcia" (gdy layout je ma) i „Kod QR". Rozmiar tekstu i logotypy są
// w zakładce „Wygląd" (`LookFields`). Formularz layoutu (FormWyklad, FormGosc,
// ...) podaje tylko swoją listę pól.
export function PosterForm({ value, onChange, fields, photoLabel, children }: PosterFormProps) {
  return (
    <div className={PANEL_STACK}>
      <FormGroup title="Teksty">
        {fields.map((field) => (
          <FormField key={field.name} field={field} value={value} onChange={onChange} />
        ))}
      </FormGroup>
      {children}
      {photoLabel && (
        <FormGroup title="Zdjęcia">
          <PhotoGalleryField fieldKey="photo" label={photoLabel} value={value} onChange={onChange} />
        </FormGroup>
      )}
      <FormGroup title="Kod QR">
        <QrField value={value} onChange={onChange} />
      </FormGroup>
    </div>
  )
}
