import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { LogoField } from './LogoField'

// Formularz dla 1l · Ogłoszenie - krótszy zestaw pól (bez daty, godziny
// i lokalizacji), do cytatów, komunikatów i podziękowań.
export function Form1l({ value, onFieldChange, onLogoChange, onLogoEnabledChange }) {
  return (
    <form className="image-form" onSubmit={(e) => e.preventDefault()}>
      <FormField type="text" label="Treść ogłoszenia / cytatu" placeholder={PLACEHOLDERS.title} value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField type="text" label="Autor / podpis (opcjonalnie)" value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />

      <LogoField fieldKey="pk" label="Logo PK" value={value} onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
    </form>
  )
}
