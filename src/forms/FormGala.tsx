import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { LogoField } from './LogoField'

// Formularz dla Gala - tylko logo PK, bez logo wydziału i bez zdjęć.
export function FormGala({ value, onFieldChange, onLogoChange, onLogoEnabledChange }: FormProps) {
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <FormField type="text" label="Etykieta" placeholder="GALA SKNM" value={value.badge} onChange={(v) => onFieldChange('badge', v)} />
      <FormField type="text" label="Tytuł" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField type="text" label="Opis / podtytuł" value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />
      <FormField type="text" label="Prelegent / organizator" placeholder={PLACEHOLDERS.speaker} value={value.speaker} onChange={(v) => onFieldChange('speaker', v)} />
      <FormField type="date" label="Data" placeholder={PLACEHOLDERS.event_date} value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />
      <FormField type="time" label="Godzina" placeholder={PLACEHOLDERS.event_time} value={value.event_time} onChange={(v) => onFieldChange('event_time', v)} />
      <FormField type="text" label="Lokalizacja" placeholder={PLACEHOLDERS.location} value={value.location} onChange={(v) => onFieldChange('location', v)} />

      <LogoField fieldKey="pk" label="Logo PK" value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
    </form>
  )
}
