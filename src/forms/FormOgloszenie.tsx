import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { GraphicsField } from './GraphicsField'

// Formularz Ogłoszenia - krótszy zestaw pól (bez daty, godziny
// i lokalizacji), do cytatów, komunikatów i podziękowań.
export function FormOgloszenie({ value, onFieldChange, onVisibilityChange, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange }: FormProps) {
  const vis = { visibility: value.visibility, onVisibilityChange }
  const gfx = { value, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange }
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <FormField name="title" {...vis} type="text" label="Treść ogłoszenia / cytatu" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField name="subtitle" {...vis} type="text" label="Autor / podpis (opcjonalnie)" value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />

      <GraphicsField {...gfx} />
    </form>
  )
}
