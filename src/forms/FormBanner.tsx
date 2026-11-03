import type { FormProps, PosterLang } from '../types'
import { setBannerShowEvent } from '../editor/formState'
import { CLUB_NAME } from '../posters/copy'
import { FIELDS } from './fields'
import type { FieldSpec } from './fields'
import { FormField } from './FormField'
import { FormGroup, PANEL_STACK } from './FormGroup'
import { PhotoGalleryField } from './PhotoGalleryField'
import { QrField } from './QrField'

interface FormBannerProps extends FormProps {
  // Czy baner wybranego layoutu ma miejsce na zdjęcie (Gość, Warsztat).
  photo?: boolean
  // Język plakatu - nazwa koła w podpowiedzi pola tekstu.
  lang?: PosterLang
}

const EVENT_FIELDS = [FIELDS.date, FIELDS.time, FIELDS.location]

// Treść banera (zakładka „Treść" w trybie „Baner"), wspólna dla wszystkich
// layoutów: duży tekst banera (pusty = nazwa koła) i opcjonalna linia z datą,
// godziną i miejscem - te wartości są wspólne z plakatem, ale oko plakatu
// nie działa na baner, więc tu go nie ma. Dalej zdjęcie i kod QR; rozmiar
// tekstu i logotypy są w zakładce „Wygląd".
export function FormBanner({ value, onChange, photo, lang = 'pl' }: FormBannerProps) {
  const titleField: FieldSpec = { name: 'bannerTitle', label: 'Tekst banera', type: 'textarea', rows: 2, placeholder: CLUB_NAME[lang] }
  return (
    <div className={PANEL_STACK}>
      <FormGroup title="Tekst">
        <FormField field={titleField} value={value} onChange={onChange} visibilityToggle={false} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 cursor-pointer accent-accent"
            checked={value.bannerShowEvent}
            onChange={(e) => onChange(setBannerShowEvent(e.target.checked))}
          />
          Pokaż datę i miejsce
        </label>
        {value.bannerShowEvent &&
          EVENT_FIELDS.map((field) => <FormField key={field.name} field={field} value={value} onChange={onChange} visibilityToggle={false} />)}
      </FormGroup>
      {photo && (
        <FormGroup title="Zdjęcia">
          <PhotoGalleryField fieldKey="photo" label="Zdjęcie" value={value} onChange={onChange} />
        </FormGroup>
      )}
      <FormGroup title="Kod QR">
        <QrField value={value} onChange={onChange} />
      </FormGroup>
    </div>
  )
}
