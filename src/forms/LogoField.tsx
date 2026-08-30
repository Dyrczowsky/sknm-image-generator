import type { FormValues } from '../types'
import { ImageUpload } from '../components/ImageUpload'

interface LogoFieldProps {
  fieldKey: string
  label: string
  value: FormValues
  onChange: (fieldKey: string, src: string | null) => void
  onEnabledChange: (fieldKey: string, checked: boolean) => void
  // `false` → slot bez domyślnego logo PK (pusty, dowolna grafika użytkownika).
  fallback?: boolean
}

// Slot na grafikę (checkbox włącz/wyłącz + upload) dla jednego klucza w
// `value.logos`, np. "pk" albo "faculty".
export function LogoField({ fieldKey, label, value, onChange, onEnabledChange, fallback = true }: LogoFieldProps) {
  const logo = value.logos[fieldKey]
  return (
    <ImageUpload
      label={label}
      hint={
        fallback
          ? 'Najlepiej plik SVG (skaluje się bez utraty jakości), PNG lub JPG też zadziałają. Bez wgranego pliku pojawi się domyślne logo PK.'
          : 'Dowolna grafika (logo wydziału, patrona, kod QR…). SVG / PNG / JPG. Bez pliku zostaje puste, zarezerwowane miejsce.'
      }
      value={logo?.src ?? null}
      onChange={(src) => onChange(fieldKey, src)}
      enabled={logo?.enabled ?? true}
      onEnabledChange={(checked) => onEnabledChange(fieldKey, checked)}
    />
  )
}
