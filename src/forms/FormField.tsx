import type { ReactNode } from 'react'

interface FormFieldProps {
  type: string
  label: ReactNode
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

// Pojedyncze pole tekstowe/data/godzina - lekki wrapper na <label><input>,
// współdzielony przez formularze w tym folderze (patrz też ImageUpload dla
// logo/zdjęć).
export function FormField({ type, label, placeholder, value, onChange }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-[0.9rem]">
      {label}
      <input
        className="rounded-lg border border-field-border bg-field px-3 py-[9px] text-base text-fg transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
