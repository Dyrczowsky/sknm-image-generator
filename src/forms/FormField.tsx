import type { FormProps } from '../types'
import { CHECKBOX } from '../components/styles'
import { setField, setFieldVisible } from '../editor/formState'
import { placeholderFor } from '../posters/fallback'
import type { FieldSpec } from './fields'

const FIELD_CLASS =
  'rounded-lg border border-field-border bg-field px-3 py-[9px] text-base text-fg transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-soft)]'

interface FormFieldProps extends FormProps {
  field: FieldSpec
}

// Pojedyncze pole tekstowe/data/godzina/akapit. Checkbox przy etykiecie
// steruje widocznością pola na plakacie - odznaczone pole znika z układu.
export function FormField({ field, value, onChange }: FormFieldProps) {
  const { name, label, type = 'text' } = field
  const visible = value.visibility[name] !== false
  const input = {
    placeholder: field.placeholder ?? placeholderFor(name),
    value: value[name],
    'aria-label': label,
    onChange: (e: { target: { value: string } }) => onChange(setField(name, e.target.value)),
  }

  return (
    <div className="flex flex-col gap-1.5 text-[0.9rem]">
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          className={CHECKBOX}
          checked={visible}
          onChange={(e) => onChange(setFieldVisible(name, e.target.checked))}
          aria-label={`Pokaż na plakacie: ${label}`}
        />
        <span className={visible ? undefined : 'text-muted'}>{label}</span>
      </span>
      {type === 'textarea' ? (
        <textarea className={`${FIELD_CLASS} resize-y`} rows={5} {...input} />
      ) : (
        <input className={FIELD_CLASS} type={type} {...input} />
      )}
    </div>
  )
}
