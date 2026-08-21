import { PLACEHOLDERS } from '../posters/fallback'
import { ImageUpload } from './ImageUpload'

// Formularz generowany wyłącznie na podstawie `fields` (patrz
// src/posters/registry.js) - żadne pole nie jest tu na sztywno wpisane, więc
// formularz zawsze dokładnie odpowiada temu, czego wybrany szablon
// faktycznie potrzebuje (tekst, logo, zdjęcia).
export function PosterForm({
  fields,
  value,
  onFieldChange,
  onLogoChange,
  onLogoEnabledChange,
  onPhotoChange,
  onPhotoEnabledChange,
  onPhotoPositionChange,
}) {
  return (
    <form className="image-form" onSubmit={(e) => e.preventDefault()}>
      {fields.map((field) => {
        if (field.type === 'logo') {
          const logo = value.logos[field.key]
          return (
            <ImageUpload
              key={field.key}
              label={field.label}
              hint="Najlepiej plik SVG (skaluje się bez utraty jakości), PNG lub JPG też zadziałają. Bez wgranego pliku pojawi się domyślne logo PK."
              value={logo?.src ?? null}
              onChange={(src) => onLogoChange(field.key, src)}
              enabled={logo?.enabled ?? true}
              onEnabledChange={(checked) => onLogoEnabledChange(field.key, checked)}
            />
          )
        }

        if (field.type === 'photo') {
          const photo = value.photos[field.key]
          return (
            <ImageUpload
              key={field.key}
              label={field.label}
              hint="Ten szablon ma miejsce na zdjęcie - bez wgranego pliku zostanie placeholder."
              value={photo?.src ?? null}
              onChange={(src) => onPhotoChange(field.key, src)}
              enabled={photo?.enabled ?? true}
              onEnabledChange={(checked) => onPhotoEnabledChange(field.key, checked)}
              position={{ x: photo?.x ?? 50, y: photo?.y ?? 50 }}
              onPositionChange={(partial) => onPhotoPositionChange(field.key, partial)}
            />
          )
        }

        return (
          <label key={field.key} className="image-form-field">
            {field.label}
            <input
              type={field.type}
              placeholder={PLACEHOLDERS[field.key]}
              value={value[field.key] ?? ''}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
            />
          </label>
        )
      })}
    </form>
  )
}
