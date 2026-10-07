import type { FormProps } from '../types'
import { ImageUpload } from '../components/ImageUpload'
import { FORM_SECTION } from '../components/styles'
import { addPhoto, removePhoto, replacePhoto, setPhotoPosition } from '../editor/formState'

interface PhotoGalleryFieldProps extends FormProps {
  // Klucz galerii w `value.photos` (plakaty czytają `photos.<fieldKey>`).
  fieldKey: string
  label: string
  max?: number
}

// Galeria zdjęć (0..max) dla jednego klucza w `value.photos`, każde zdjęcie
// z możliwością ustawienia kadru (pozycja X/Y). Dodanie pliku zawsze dokłada
// kolejny wpis; pod istniejącym wpisem plik można podmienić albo usunąć.
export function PhotoGalleryField({ fieldKey, label, max = 4, value, onChange }: PhotoGalleryFieldProps) {
  const photos = value.photos[fieldKey] ?? []
  const empty = photos.length === 0

  return (
    <div className={FORM_SECTION}>
      {!empty && <span className="text-[0.9rem] font-medium">{label}</span>}
      {photos.map((photo, i) => (
        <ImageUpload
          key={i}
          label={`${label} ${i + 1}`}
          value={photo.src}
          onChange={(src) => onChange(src ? replacePhoto(fieldKey, i, src) : removePhoto(fieldKey, i))}
          position={{ x: photo.x, y: photo.y }}
          onPositionChange={(position) => onChange(setPhotoPosition(fieldKey, i, position))}
        />
      ))}
      {photos.length < max && (
        <ImageUpload
          label={empty ? label : `Dodaj kolejne zdjęcie (${photos.length}/${max})`}
          hint={empty ? 'Ten szablon ma miejsce na zdjęcia - bez wgranego pliku zostanie placeholder.' : undefined}
          value={null}
          onChange={(src) => {
            if (src) onChange(addPhoto(fieldKey, src))
          }}
        />
      )}
    </div>
  )
}
