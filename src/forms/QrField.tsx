import type { FormProps, QrSide } from '../types'
import { Button, Field, Input } from '../components/ui'
import { setQrSide, setQrUrl } from '../editor/formState'

const SIDES: { side: QrSide; label: string }[] = [
  { side: 'left', label: 'Po lewej' },
  { side: 'right', label: 'Przy logotypach' },
]

interface QrFieldProps extends FormProps {
  // Wybór strony kodu w stopce (plakaty; baner ma stały układ).
  withSide?: boolean
}

// Link zamieniany na kod QR w stopce plakatu (zakładka „Treść", grupa „Kod QR").
export function QrField({ value, onChange, withSide = false }: QrFieldProps) {
  return (
    <>
      <Field label="Adres strony" hint="Kod QR wygeneruje się w stopce plakatu (tło przezroczyste, kolor ze schematu). Puste pole - bez kodu.">
        <Input type="url" inputMode="url" placeholder="https://sknm.pk.edu.pl/..." value={value.qrUrl} onChange={(e) => onChange(setQrUrl(e.target.value))} />
      </Field>
      {withSide && (
        <div role="group" aria-label="Położenie kodu QR" className="flex flex-col gap-1.5">
          <span className="text-sm">Położenie kodu QR</span>
          <div className="flex gap-2">
            {SIDES.map(({ side, label }) => (
              <Button
                key={side}
                variant="outline"
                iconEnd={value.qrSide === side ? 'check' : undefined}
                aria-pressed={value.qrSide === side}
                onClick={() => onChange(setQrSide(side))}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
