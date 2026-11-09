import { Button } from '../components/ui'

interface ChoiceProps<T extends string> {
  label: string
  options: { key: T; label: string }[]
  current: T
  onPick: (key: T) => void
}

// Grupa przycisków „wybierz jedno" (stan w aria-pressed, ptaszek przy wybranym).
export function Choice<T extends string>({ label, options, current, onPick }: ChoiceProps<T>) {
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
