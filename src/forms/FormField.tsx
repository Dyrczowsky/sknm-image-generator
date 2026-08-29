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
    <label className="image-form-field">
      {label}
      <input type={type} placeholder={placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
