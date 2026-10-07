import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-fg/[0.08] text-fg',
  accent: 'bg-accent-soft text-accent-text',
  success: 'bg-success/[0.14] text-success',
  warning: 'bg-warning/[0.16] text-warning',
  danger: 'bg-danger-soft text-danger',
}

interface BadgeProps {
  tone?: BadgeTone
  // Ikona przed tekstem - stan (zapisano / błąd) nie może wisieć na samym kolorze.
  icon?: IconName
  // Dopowiedzenie dla czytników ekranu, gdy sama treść to za mało,
  // np. liczba „3" z `srLabel="otwarte notatki"` czyta się „3 otwarte notatki".
  srLabel?: string
  className?: string
  children: ReactNode
}

// Pigułka: licznik (przy pozycji nawigacji, zakładce) albo krótki stan
// („Otwarty", „Udostępniony", „Zapisano").
export function Badge({ tone = 'neutral', icon, srLabel, className, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-5 min-w-5 flex-none items-center justify-center gap-1 whitespace-nowrap rounded-full px-1.5 text-[0.75rem] font-semibold leading-none tabular-nums ${TONE[tone]}${className ? ` ${className}` : ''}`}
    >
      {icon && <Icon name={icon} className="-ml-px size-3.5" />}
      {children}
      {srLabel && <span className="sr-only"> {srLabel}</span>}
    </span>
  )
}
