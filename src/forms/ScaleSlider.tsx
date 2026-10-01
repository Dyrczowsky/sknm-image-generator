const MIN_PERCENT = 70
const MAX_PERCENT = 130
const STEP_PERCENT = 5

interface ScaleSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
}

// Pojedynczy suwak mnożnika rozmiaru (70%-130%, krok 5%) - klocek
// współdzielony przez `TitleTextScaleFields` (tytuł + pozostały tekst).
export function ScaleSlider({ label, value, onChange }: ScaleSliderProps) {
  const percent = Math.round(value * 100)

  return (
    <div className="flex flex-col gap-1.5 text-[0.9rem]">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className="text-muted">{percent}%</span>
      </span>
      <input
        type="range"
        className="w-full cursor-pointer accent-accent"
        min={MIN_PERCENT}
        max={MAX_PERCENT}
        step={STEP_PERCENT}
        value={percent}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </div>
  )
}
