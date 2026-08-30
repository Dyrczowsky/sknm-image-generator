import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { LogoField } from './LogoField'

// Formularz Ogłoszenia - krótszy zestaw pól (bez daty, godziny
// i lokalizacji), do cytatów, komunikatów i podziękowań.
export function FormOgloszenie({ value, onFieldChange, onVisibilityChange, onLogoChange, onLogoEnabledChange }: FormProps) {
  const vis = { visibility: value.visibility, onVisibilityChange }
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <FormField name="title" {...vis} type="text" label="Treść ogłoszenia / cytatu" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField name="subtitle" {...vis} type="text" label="Autor / podpis (opcjonalnie)" value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />

      <LogoField fieldKey="pk" label="Logo PK / grafika 1" value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
      <LogoField fieldKey="faculty" label="Grafika 2" fallback={false} value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
    </form>
  )
}
