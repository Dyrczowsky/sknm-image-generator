import { Field, useFieldControl } from '../components/ui'

const MIN_PERCENT = 70
const MAX_PERCENT = 130
const STEP_PERCENT = 5

interface ScaleSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
}

// Suwak jest kontrolką `Field`, żeby etykieta była prawdziwym `<label for>`.
function Range({ percent, onChange }: { percent: number; onChange: (value: number) => void }) {
  const control = useFieldControl({})
  return (
    <input
      {...control}
      type="range"
      className="h-6 w-full cursor-pointer accent-accent"
      min={MIN_PERCENT}
      max={MAX_PERCENT}
      step={STEP_PERCENT}
      value={percent}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
    />
  )
}

// Pojedynczy suwak mnożnika rozmiaru (70%-130%, krok 5%) - klocek
// współdzielony przez `TitleTextScaleFields` (tytuł + pozostały tekst).
export function ScaleSlider({ label, value, onChange }: ScaleSliderProps) {
  const percent = Math.round(value * 100)
  return (
    <Field label={label} action={<span className="text-[0.8125rem] tabular-nums text-muted">{percent}%</span>}>
      <Range percent={percent} onChange={onChange} />
    </Field>
  )
}
