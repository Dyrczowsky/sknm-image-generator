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
export function FormBanner({
  value,
  photo,
  onGraphicsAdd,
  onGraphicRemove,
  onGraphicMove,
  onShowPkChange,
  onQrUrlChange,
  onPhotoAdd,
  onPhotoChangeAt,
  onPhotoPositionChangeAt,
  onTitleScaleChange,
  onTextScaleChange,
  onScaleLinkedChange,
}: FormBannerProps) {
  const gfx = { value, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange, onQrUrlChange }
  const scale = { titleScale: value.titleScale, textScale: value.textScale, linked: value.scaleLinked, onTitleScaleChange, onTextScaleChange, onLinkedChange: onScaleLinkedChange }
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <p className="text-[0.85rem] text-muted">Baner pokazuje nazwę koła — pola wydarzenia (tytuł, prelegent, data) dotyczą tylko zakładki „Social media".</p>
      <TitleTextScaleFields {...scale} />
      <GraphicsField {...gfx} />
      {photo && (
        <PhotoGalleryField
          fieldKey="photo"
          label="Zdjęcie"
          max={4}
          value={value}
          onAdd={onPhotoAdd}
          onChangeAt={onPhotoChangeAt}
          onPositionChangeAt={onPhotoPositionChangeAt}
        />
      )}
    </form>
  )
}
