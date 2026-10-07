import type { ControlSize } from './styles'

interface SegmentedToggleProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
  ariaLabel: string
  // Wysokość jak w prymitywach `ui/` (sm 36 / 40 px, md 40 / 44 px), więc
  // przełącznik stoi w jednym rzędzie z przyciskami i polami.
  size?: ControlSize
  // Opcje dzielą całą szerokość po równo (np. „Edycja | Podgląd" na telefonie).
  fill?: boolean
  className?: string
}

const HEIGHT: Record<ControlSize, string> = {
  sm: 'h-10 min-[900px]:h-9',
  md: 'h-11 min-[900px]:h-10',
}

const TRACK = 'items-stretch gap-0.5 rounded-lg border border-border bg-sunken p-0.5'
// Waga pisma jest stała, żeby zmiana opcji nie przesuwała sąsiadów; wybraną
// opcję wyróżnia wypukła płytka (kształt), nie sam kolor.
const OPTION =
  'inline-flex min-w-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-md border-0 px-3 text-[0.8125rem] font-semibold leading-none transition-colors duration-150 focus-visible:-outline-offset-2'
const ACTIVE = 'bg-field text-fg shadow-[0_1px_2px_rgb(0_0_0/0.18),0_0_0_1px_rgb(128_128_128/0.22)]'
const INACTIVE = 'bg-transparent text-muted hover:text-fg'

// Przełącznik segmentowy (jedna aktywna opcja z kilku) - wspólny wygląd dla
// rodzaju grafiki, języka plakatu, orientacji strony, typu pliku i widoku
// edytora na telefonie.
export function SegmentedToggle<T extends string>({ value, onChange, options, ariaLabel, size = 'sm', fill = false, className }: SegmentedToggleProps<T>) {
  return (
    <div
      className={`${fill ? 'flex w-full' : 'inline-flex flex-none'} ${HEIGHT[size]} ${TRACK}${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${OPTION} ${fill ? 'flex-1' : ''} ${value === option.value ? ACTIVE : INACTIVE}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
