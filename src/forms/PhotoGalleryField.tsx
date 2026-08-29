import type { FormValues } from '../types'
import { ImageUpload } from '../components/ImageUpload'

interface PhotoGalleryFieldProps {
  fieldKey: string
  label: string
  max?: number
  value: FormValues
  onAdd: (fieldKey: string, src: string | null) => void
  onChangeAt: (fieldKey: string, index: number, src: string | null) => void
  onPositionChangeAt: (fieldKey: string, index: number, partial: { x?: number; y?: number }) => void
}

// Galeria zdjęć (0..max) dla jednego klucza w `value.photos`, każde zdjęcie
// z możliwością ustawienia kadru (pozycja X/Y). Dodanie pliku zawsze dokłada
// kolejny wpis; zmiana pliku pod istniejącym wpisem albo go zastępuje, albo
// (gdy `null`) usuwa.
export function PhotoGalleryField({ fieldKey, label, max = 4, value, onAdd, onChangeAt, onPositionChangeAt }: PhotoGalleryFieldProps) {
  const items = value.photos[fieldKey] ?? []

  return (
    <div className="mt-[18px] flex flex-col gap-2.5 border-t border-border pt-[18px]">
      {items.length > 0 && <span className="text-[0.9rem] font-medium">{label}</span>}
      {items.map((photo, i) => (
        <ImageUpload
          key={i}
          divider={false}
          label={`${label} ${i + 1}`}
          value={photo.src}
          onChange={(src) => onChangeAt(fieldKey, i, src)}
          position={{ x: photo.x ?? 50, y: photo.y ?? 50 }}
          onPositionChange={(partial) => onPositionChangeAt(fieldKey, i, partial)}
        />
      ))}
      {items.length < max && (
        <ImageUpload
          divider={false}
          label={items.length === 0 ? label : `Dodaj kolejne zdjęcie (${items.length}/${max})`}
          hint={items.length === 0 ? 'Ten szablon ma miejsce na zdjęcia - bez wgranego pliku zostanie placeholder.' : undefined}
          value={null}
          onChange={(src) => onAdd(fieldKey, src)}
        />
      )}
    </div>
  )
}
