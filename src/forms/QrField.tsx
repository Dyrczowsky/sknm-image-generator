import type { FormProps, QrPlacement, QrSide } from '../types'
import { Button, Field, Input } from '../components/ui'
import { setQrPlacement, setQrSide, setQrUrl } from '../editor/formState'

const SIDES: { key: QrSide; label: string }[] = [
  { key: 'left', label: 'Po lewej' },
  { key: 'right', label: 'Przy logotypach' },
]

const PLACEMENTS: { key: QrPlacement; label: string }[] = [
  { key: 'above', label: 'Nad stopką' },
  { key: 'inline', label: 'W stopce' },
]

interface QrFieldProps extends FormProps {
  // Wybór „nad stopką / w stopce" (plakaty; baner jest za niski na osobny wiersz).
  withPlacement?: boolean
}

interface ChoiceProps<T extends string> {
  label: string
  options: { key: T; label: string }[]
  current: T
  onPick: (key: T) => void
}

function Choice<T extends string>({ label, options, current, onPick }: ChoiceProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-sm">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(({ key, label: text }) => (
          <Button key={key} variant="outline" iconEnd={current === key ? 'check' : undefined} aria-pressed={current === key} onClick={() => onPick(key)}>
            {text}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Link zamieniany na kod QR w stopce plakatu (zakładka „Treść", grupa „Kod QR").
// Kod zawsze stoi przy krawędzi kadru albo przy logotypach - patrz PosterFooter.
export function QrField({ value, onChange, withPlacement = false }: QrFieldProps) {
  const hasQr = value.qrUrl.trim() !== ''
  return (
    <>
      <Field label="Adres strony" hint="Kod QR wygeneruje się w stopce plakatu (tło przezroczyste, kolor ze schematu). Puste pole - bez kodu.">
        <Input type="url" inputMode="url" placeholder="https://sknm.pk.edu.pl/..." value={value.qrUrl} onChange={(e) => onChange(setQrUrl(e.target.value))} />
      </Field>
      {hasQr && (
        <>
          <Choice label="Strona kodu QR" options={SIDES} current={value.qrSide} onPick={(side) => onChange(setQrSide(side))} />
          {withPlacement && (
            <Choice label="Położenie kodu QR" options={PLACEMENTS} current={value.qrPlacement} onPick={(p) => onChange(setQrPlacement(p))} />
          )}
        </>
      )}
    </>
  )
}
