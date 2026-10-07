import type { ReactNode } from 'react'
import type { FormProps } from '../types'
import type { FieldSpec } from './fields'
import { FormField } from './FormField'
import { GraphicsField } from './GraphicsField'
import { PhotoGalleryField } from './PhotoGalleryField'
import { TitleTextScaleFields } from './TitleTextScaleFields'

interface PosterFormProps extends FormProps {
  fields: FieldSpec[]
  // Podpis galerii zdjęć. Brak = layout nie ma miejsca na zdjęcia.
  photoLabel?: string
  // Sekcje własne layoutu (np. program konferencji) - między polami a grafikami.
  children?: ReactNode
}

// Wspólny szkielet formularza layoutu: suwaki rozmiaru, pola tekstowe,
// grafiki stopki z kodem QR i (opcjonalnie) galeria zdjęć. Formularz layoutu
// (FormWyklad, FormGosc, ...) podaje tylko swoją listę pól.
export function PosterForm({ value, onChange, fields, photoLabel, children }: PosterFormProps) {
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <TitleTextScaleFields value={value} onChange={onChange} />
      {fields.map((field) => (
        <FormField key={field.name} field={field} value={value} onChange={onChange} />
      ))}
      {children}
      <GraphicsField value={value} onChange={onChange} />
      {photoLabel && <PhotoGalleryField fieldKey="photo" label={photoLabel} value={value} onChange={onChange} />}
    </form>
  )
}
