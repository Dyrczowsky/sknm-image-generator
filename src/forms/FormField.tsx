import type { FormProps } from '../types'
import { Field, IconButton, Input, Textarea } from '../components/ui'
import { setField, setFieldVisible } from '../editor/formState'
import { placeholderFor } from '../posters/fallback'
import type { FieldSpec } from './fields'

interface FormFieldProps extends FormProps {
  field: FieldSpec
}

// Pojedyncze pole tekstowe/data/godzina/akapit. Przełącznik oka przy etykiecie
// steruje widocznością pola na plakacie - ukryte pole znika z układu, a jego
// wejście zostaje edytowalne (tylko przygaszone).
export function FormField({ field, value, onChange }: FormFieldProps) {
  const { name, label, type = 'text' } = field
  const visible = value.visibility[name] !== false
  const control = {
    placeholder: field.placeholder ?? placeholderFor(name),
    value: value[name],
    className: visible ? undefined : 'opacity-60',
    onChange: (e: { target: { value: string } }) => onChange(setField(name, e.target.value)),
  }
  const toggle = (
    <IconButton
      icon={visible ? 'eye' : 'eyeOff'}
      label={`${visible ? 'Ukryj na plakacie' : 'Pokaż na plakacie'}: ${label}`}
      aria-pressed={visible}
      onClick={() => onChange(setFieldVisible(name, !visible))}
    />
  )

  return (
    <Field label={label} action={toggle}>
      {type === 'textarea' ? <Textarea rows={5} {...control} /> : <Input type={type} {...control} />}
    </Field>
  )
}
