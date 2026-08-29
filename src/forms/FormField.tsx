import type { ReactNode } from 'react'
import type { FieldVisibility, FormTextField } from '../types'

interface FormFieldProps {
  type: string
  label: ReactNode
  placeholder?: string
  value: string
  onChange: (value: string) => void
  // Podane razem → przy etykiecie pojawia się checkbox widoczności pola.
  name?: FormTextField
  visibility?: FieldVisibility
  onVisibilityChange?: (name: FormTextField, visible: boolean) => void
}

// Pojedyncze pole tekstowe/data/godzina - lekki wrapper na <label><input>,
// współdzielony przez formularze w tym folderze (patrz też ImageUpload dla
// logo/zdjęć). Checkbox przy etykiecie steruje `visibility` - odznaczenie
// ukrywa dane pole na plakacie (opacity: 0), nie usuwając go z layoutu.
export function FormField({ type, label, placeholder, value, onChange, name, visibility, onVisibilityChange }: FormFieldProps) {
  const showToggle = name !== undefined && onVisibilityChange !== undefined
  const visible = name === undefined || visibility?.[name] !== false

  return (
    <div className="flex flex-col gap-1.5 text-[0.9rem]">
      <span className="flex items-center gap-2">
        {showToggle && (
          <input
            type="checkbox"
            className="h-[15px] w-[15px] flex-none cursor-pointer accent-accent"
            checked={visible}
            onChange={(e) => onVisibilityChange(name, e.target.checked)}
            aria-label={typeof label === 'string' ? `Pokaż na plakacie: ${label}` : 'Pokaż pole na plakacie'}
          />
        )}
        <span className={visible ? undefined : 'text-muted'}>{label}</span>
      </span>
      <input
        className="rounded-lg border border-field-border bg-field px-3 py-[9px] text-base text-fg transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        aria-label={typeof label === 'string' ? label : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
