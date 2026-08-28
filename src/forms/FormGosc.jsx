import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { LogoField } from './LogoField'
import { PhotoGalleryField } from './PhotoGalleryField'

// Formularz dla Gość - logo PK + logo wydziału + zdjęcie prelegenta.
export function FormGosc({
  value,
  onFieldChange,
  onLogoChange,
  onLogoEnabledChange,
  onPhotoAdd,
  onPhotoChangeAt,
  onPhotoPositionChangeAt,
}) {
  return (
    <form className="image-form" onSubmit={(e) => e.preventDefault()}>
      <FormField type="text" label="Etykieta" placeholder="SEMINARIUM SKNM" value={value.badge} onChange={(v) => onFieldChange('badge', v)} />
      <FormField type="text" label="Tytuł" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField type="text" label="Opis / podtytuł" value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />
      <FormField type="text" label="Prelegent / organizator" placeholder={PLACEHOLDERS.speaker} value={value.speaker} onChange={(v) => onFieldChange('speaker', v)} />
      <FormField type="date" label="Data" placeholder={PLACEHOLDERS.event_date} value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />
      <FormField type="time" label="Godzina" placeholder={PLACEHOLDERS.event_time} value={value.event_time} onChange={(v) => onFieldChange('event_time', v)} />
      <FormField type="text" label="Lokalizacja" placeholder={PLACEHOLDERS.location} value={value.location} onChange={(v) => onFieldChange('location', v)} />

      <LogoField fieldKey="pk" label="Logo PK" value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
      <LogoField fieldKey="faculty" label="Logo wydziału" value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />

      <PhotoGalleryField
        fieldKey="photo"
        label="Zdjęcie prelegenta"
        max={4}
        value={value}
        onAdd={onPhotoAdd}
        onChangeAt={onPhotoChangeAt}
        onPositionChangeAt={onPhotoPositionChangeAt}
      />
    </form>
  )
}
