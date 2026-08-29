import type { CSSProperties, ReactNode } from 'react'
import { typography } from '../theme'

interface BadgeProps {
  children: ReactNode
  color?: string
  background?: string
  style?: CSSProperties
}

// Plakietka/tag mono z letter-spacingiem. Podaj `background`, żeby dostać
// wypełnioną pigułkę (jak "WYKŁAD OTWARTY") - bez niego to sam kolorowy
// napis (jak "SEMINARIUM SKNM" w niektórych szablonach).
export function Badge({ children, color, background, style }: BadgeProps) {
  return (
    <div
      style={{
        ...typography.tag,
        color,
        background,
        padding: background ? '10px 18px' : undefined,
        alignSelf: background ? 'flex-start' : undefined,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
