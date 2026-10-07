import { createContext, useContext } from 'react'

// To, co `Field` przekazuje kontrolce w środku: id dla `<label htmlFor>`,
// powiązanie z podpowiedzią / błędem i stan błędu.
export interface FieldContextValue {
  id: string
  describedBy: string | undefined
  invalid: boolean
  required: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

interface ControlA11y {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling'
  required?: boolean
}

// Atrybuty kontrolki złożone z kontekstu `Field` i jej własnych propsów
// (własne wygrywają). Poza `Field` zwraca propsy bez zmian. Użyj tego hooka,
// gdy w `Field` siedzi kontrolka inna niż Input / Textarea / Select.
export function useFieldControl<P extends ControlA11y>(props: P): P {
  const field = useContext(FieldContext)
  if (!field) return props
  return {
    ...props,
    id: props.id ?? field.id,
    'aria-describedby': props['aria-describedby'] ?? field.describedBy,
    'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
    required: props.required ?? (field.required || undefined),
  }
}
