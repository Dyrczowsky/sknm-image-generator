import type { FormProps } from '../types'
import { Field, Input } from '../components/ui'
import { setQrUrl } from '../editor/formState'

// Link zamieniany na kod QR w stopce plakatu (zakładka „Treść", grupa „Kod QR").
export function QrField({ value, onChange }: FormProps) {
  return (
    <Field label="Adres strony" hint="Kod QR wygeneruje się w stopce plakatu (tło przezroczyste, kolor ze schematu). Puste pole - bez kodu.">
      <Input type="url" inputMode="url" placeholder="https://sknm.pk.edu.pl/..." value={value.qrUrl} onChange={(e) => onChange(setQrUrl(e.target.value))} />
    </Field>
  )
}
