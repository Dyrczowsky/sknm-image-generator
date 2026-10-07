import type { FormProps } from '../types'
import { GraphicsField } from './GraphicsField'
import { PhotoGalleryField } from './PhotoGalleryField'
import { TitleTextScaleFields } from './TitleTextScaleFields'

interface FormBannerProps extends FormProps {
  // Czy baner wybranego layoutu ma miejsce na zdjęcie (Gość, Warsztat).
  photo?: boolean
}

// Formularz zakładki „Baner" - wspólny dla wszystkich layoutów. Baner niesie
// stałą nazwę koła, więc nie ma tu pól wydarzenia (tytuł, prelegent, data):
// zostaje rozmiar tekstu, logotypy z kodem QR i ewentualne zdjęcie.
export function FormBanner({ value, onChange, photo }: FormBannerProps) {
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <p className="text-[0.85rem] text-muted">Baner pokazuje nazwę koła — pola wydarzenia (tytuł, prelegent, data) dotyczą tylko zakładki „Social media".</p>
      <TitleTextScaleFields value={value} onChange={onChange} />
      <GraphicsField value={value} onChange={onChange} />
      {photo && <PhotoGalleryField fieldKey="photo" label="Zdjęcie" value={value} onChange={onChange} />}
    </form>
  )
}
