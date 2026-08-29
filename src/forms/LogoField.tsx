import type { FormValues } from '../types'
import { ImageUpload } from '../components/ImageUpload'

interface LogoFieldProps {
  fieldKey: string
  label: string
  value: FormValues
  onChange: (fieldKey: string, src: string | null) => void
  onEnabledChange: (fieldKey: string, checked: boolean) => void
}

// Slot na logo (checkbox włącz/wyłącz + upload) dla jednego klucza w
// `value.logos`, np. "pk" albo "faculty".
export function LogoField({ fieldKey, label, value, onChange, onEnabledChange }: LogoFieldProps) {
  const logo = value.logos[fieldKey]
  return (
    <ImageUpload
      label={label}
      hint="Najlepiej plik SVG (skaluje się bez utraty jakości), PNG lub JPG też zadziałają. Bez wgranego pliku pojawi się domyślne logo PK."
      value={logo?.src ?? null}
      onChange={(src) => onChange(fieldKey, src)}
      enabled={logo?.enabled ?? true}
      onEnabledChange={(checked) => onEnabledChange(fieldKey, checked)}
    />
  )
}
