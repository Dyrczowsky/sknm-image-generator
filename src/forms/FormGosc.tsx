import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { GraphicsField } from './GraphicsField'
import { ColorField } from './ColorField'
import { PhotoGalleryField } from './PhotoGalleryField'

// Formularz dla Gość - logo PK + logo wydziału + zdjęcie prelegenta.
export function FormGosc({
  value,
  onFieldChange,
  onVisibilityChange,
  onGraphicsAdd,
  onGraphicRemove,
  onGraphicMove,
  onShowPkChange,
  onQrUrlChange,
  onColorChange,
  onPhotoAdd,
  onPhotoChangeAt,
  onPhotoPositionChangeAt,
}: FormProps) {
  const vis = { visibility: value.visibility, onVisibilityChange }
  const gfx = { value, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange, onQrUrlChange }
  const c = value.colors
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <FormField name="badge" {...vis} type="text" label="Etykieta" placeholder="SEMINARIUM SKNM" value={value.badge} onChange={(v) => onFieldChange('badge', v)} />
      <FormField name="title" {...vis} type="text" label="Tytuł" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField name="subtitle" {...vis} type="text" label="Opis / podtytuł" value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />
      <FormField name="speaker" {...vis} type="text" label="Prelegent / organizator" placeholder={PLACEHOLDERS.speaker} value={value.speaker} onChange={(v) => onFieldChange('speaker', v)} />
      <FormField name="event_date" {...vis} type="date" label="Data" placeholder={PLACEHOLDERS.event_date} value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />
      <FormField name="event_time" {...vis} type="time" label="Godzina" placeholder={PLACEHOLDERS.event_time} value={value.event_time} onChange={(v) => onFieldChange('event_time', v)} />
      <FormField name="location" {...vis} type="text" label="Lokalizacja" placeholder={PLACEHOLDERS.location} value={value.location} onChange={(v) => onFieldChange('location', v)} />

      <GraphicsField {...gfx} />

      <div className="mt-[18px] flex flex-col gap-2.5 border-t border-border pt-[18px]">
        <span className="text-[0.9rem] font-medium">Kolory</span>
        <ColorField
          label="Tło prostokąta z datą"
          value={c.goscBoxBg ?? ''}
          onChange={(v) => onColorChange('goscBoxBg', v)}
          fallback="#DE6E52"
          autoLabel="Domyślny (koralowy)"
        />
        <ColorField
          label="Tekst w prostokącie z datą"
          value={c.goscBoxText ?? ''}
          onChange={(v) => onColorChange('goscBoxText', v)}
          fallback="#F4F2ED"
          autoLabel="Domyślny (kremowy)"
        />
        <ColorField
          label="Kolor etykiety i „Wstęp wolny”"
          value={c.goscTextColor ?? ''}
          onChange={(v) => onColorChange('goscTextColor', v)}
          fallback="#3C459B"
          autoLabel="Kolor akcentu ze schematu"
        />
      </div>

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
