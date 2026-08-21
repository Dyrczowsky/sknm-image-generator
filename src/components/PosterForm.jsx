import { PLACEHOLDERS } from '../posters/fallback'
import { ImageUpload } from './ImageUpload'

// Formularz generowany wyłącznie na podstawie `fields` (patrz
// src/posters/registry.js) - żadne pole nie jest tu na sztywno wpisane, więc
// formularz zawsze dokładnie odpowiada temu, czego wybrany szablon
// faktycznie potrzebuje (tekst, logo, galeria zdjęć, listy typu "program").
export function PosterForm({
  fields,
  value,
  onFieldChange,
  onLogoChange,
  onLogoEnabledChange,
  onPhotoAdd,
  onPhotoChangeAt,
  onPhotoPositionChangeAt,
  onListItemAdd,
  onListItemChange,
  onListItemRemove,
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
          const items = value.photos[field.key] ?? []
          const max = field.max ?? 4
          return (
            <div key={field.key} className="field-group">
              {items.length > 0 && <span className="image-upload-label">{field.label}</span>}
              {items.map((photo, i) => (
                <ImageUpload
                  key={i}
                  label={`${field.label} ${i + 1}`}
                  value={photo.src}
                  onChange={(src) => onPhotoChangeAt(field.key, i, src)}
                  position={{ x: photo.x ?? 50, y: photo.y ?? 50 }}
                  onPositionChange={(partial) => onPhotoPositionChangeAt(field.key, i, partial)}
                />
              ))}
              {items.length < max && (
                <ImageUpload
                  label={items.length === 0 ? field.label : `Dodaj kolejne zdjęcie (${items.length}/${max})`}
                  hint={items.length === 0 ? 'Ten szablon ma miejsce na zdjęcia - bez wgranego pliku zostanie placeholder.' : undefined}
                  value={null}
                  onChange={(src) => onPhotoAdd(field.key, src)}
                />
              )}
            </div>
          )
        }

        if (field.type === 'list') {
          const items = value.lists[field.key] ?? []
          return (
            <div key={field.key} className="field-list">
              <span className="image-upload-label">{field.label}</span>
              {items.map((item, index) => (
                <div key={index} className="field-list-row">
                  {field.itemFields.map((sub) => (
                    <input
                      key={sub.key}
                      type={sub.type}
                      placeholder={sub.label}
                      value={item[sub.key] ?? ''}
                      onChange={(e) => onListItemChange(field.key, index, sub.key, e.target.value)}
                      className={sub.width === 'small' ? 'field-list-input-small' : 'field-list-input'}
                    />
                  ))}
                  <button
                    type="button"
                    className="field-list-remove"
                    onClick={() => onListItemRemove(field.key, index)}
                    aria-label="Usuń"
                  >
                    Usuń
                  </button>
                </div>
              ))}
              <button type="button" className="field-list-add" onClick={() => onListItemAdd(field.key)}>
                {field.addLabel ?? '+ Dodaj'}
              </button>
            </div>
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
