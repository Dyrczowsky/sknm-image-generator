import type { FormProps } from '../types'
import { UI_HINT } from '../components/styles'
import { FormGroup, PANEL_STACK } from './FormGroup'
import { PhotoGalleryField } from './PhotoGalleryField'
import { QrField } from './QrField'

interface FormBannerProps extends FormProps {
  // Czy baner wybranego layoutu ma miejsce na zdjęcie (Gość, Warsztat).
  photo?: boolean
}

// Treść banera (zakładka „Treść" w trybie „Baner"), wspólna dla wszystkich
// layoutów. Baner niesie stałą nazwę koła, więc nie ma tu pól wydarzenia
// (tytuł, prelegent, data): zostaje ewentualne zdjęcie i kod QR. Rozmiar
// tekstu i logotypy są w zakładce „Wygląd".
export function FormBanner({ value, onChange, photo }: FormBannerProps) {
  return (
    <div className={PANEL_STACK}>
      <p className={UI_HINT}>Baner pokazuje nazwę koła — pola wydarzenia (tytuł, prelegent, data) dotyczą tylko trybu „Social media i druk".</p>
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
