import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { GraphicsField } from './GraphicsField'
import { TitleTextScaleFields } from './TitleTextScaleFields'

// Formularz Komunikatu rozszerzonego - etykieta, nagłówek, akapit treści
// (`body`), podpis i opcjonalna data (bez godziny i lokalizacji).
export function FormKomunikat({ value, onFieldChange, onVisibilityChange, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange, onQrUrlChange, onTitleScaleChange, onTextScaleChange, onScaleLinkedChange }: FormProps) {
  const vis = { visibility: value.visibility, onVisibilityChange }
  const gfx = { value, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange, onQrUrlChange }
  const scale = { titleScale: value.titleScale, textScale: value.textScale, linked: value.scaleLinked, onTitleScaleChange, onTextScaleChange, onLinkedChange: onScaleLinkedChange }
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <TitleTextScaleFields {...scale} />
      <FormField name="badge" {...vis} type="text" label="Etykieta" placeholder="KOMUNIKAT" value={value.badge} onChange={(v) => onFieldChange('badge', v)} />
      <FormField name="title" {...vis} type="text" label="Nagłówek" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField name="body" {...vis} type="textarea" label="Treść komunikatu" placeholder={PLACEHOLDERS.body} value={value.body} onChange={(v) => onFieldChange('body', v)} />
      <FormField name="subtitle" {...vis} type="text" label="Podpis / źródło (opcjonalnie)" value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />
      <FormField name="event_date" {...vis} type="date" label="Data" placeholder={PLACEHOLDERS.event_date} value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />

      <GraphicsField {...gfx} />
    </form>
  )
}
