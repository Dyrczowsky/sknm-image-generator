import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { LogoField } from './LogoField'

// Formularz dla Wykładu - logo PK + logo wydziału, bez zdjęć.
export function FormWyklad({ value, onFieldChange, onVisibilityChange, onLogoChange, onLogoEnabledChange }: FormProps) {
  const vis = { visibility: value.visibility, onVisibilityChange }
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <FormField name="badge" {...vis} type="text" label="Etykieta" placeholder="WYKŁAD OTWARTY" value={value.badge} onChange={(v) => onFieldChange('badge', v)} />
      <FormField name="title" {...vis} type="text" label="Tytuł" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField name="subtitle" {...vis} type="text" label="Opis / podtytuł" value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />
      <FormField name="speaker" {...vis} type="text" label="Prelegent / organizator" placeholder={PLACEHOLDERS.speaker} value={value.speaker} onChange={(v) => onFieldChange('speaker', v)} />
      <FormField name="event_date" {...vis} type="date" label="Data" placeholder={PLACEHOLDERS.event_date} value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />
      <FormField name="event_time" {...vis} type="time" label="Godzina" placeholder={PLACEHOLDERS.event_time} value={value.event_time} onChange={(v) => onFieldChange('event_time', v)} />
      <FormField name="location" {...vis} type="text" label="Lokalizacja" placeholder={PLACEHOLDERS.location} value={value.location} onChange={(v) => onFieldChange('location', v)} />

      <LogoField fieldKey="pk" label="Logo PK" value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
      <LogoField fieldKey="faculty" label="Logo wydziału" value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
    </form>
  )
}
