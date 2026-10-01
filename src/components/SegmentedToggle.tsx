interface SegmentedToggleProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
  ariaLabel: string
}

// Przełącznik segmentowy (jedna aktywna opcja z kilku) - wspólny wygląd dla
// języka plakatu, orientacji strony i typu pliku.
export function SegmentedToggle<T extends string>({ value, onChange, options, ariaLabel }: SegmentedToggleProps<T>) {
  const base = 'cursor-pointer rounded-md px-3 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] transition-colors'
  const active = 'bg-accent text-white'
  const inactive = 'text-muted hover:text-fg'

  return (
    <div className="inline-flex gap-1 rounded-lg border border-field-border bg-field p-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${base} ${value === option.value ? active : inactive}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
