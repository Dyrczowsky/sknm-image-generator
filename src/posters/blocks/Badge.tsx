import type { CSSProperties, ReactNode } from 'react'
import { typography } from '../theme'
import { PosterText } from './PosterText'
import type { PosterTextProps } from './PosterText'

// Pole formularza w plakietce - edytowalne na podglądzie zamiast `children`.
export type BadgeField = Pick<PosterTextProps, 'path' | 'value' | 'fallback' | 'label'>

interface BadgeProps {
  children?: ReactNode
  field?: BadgeField
  color?: string
  background?: string
  style?: CSSProperties
}

// Plakietka/tag mono z letter-spacingiem. Podaj `background`, żeby dostać
// wypełnioną pigułkę (jak "WYKŁAD OTWARTY") - bez niego to sam kolorowy
// napis (jak "SEMINARIUM SKNM" w niektórych szablonach). Z `field` plakietka
// to pole plakatu (`PosterText`) w tym samym elemencie i stylu.
export function Badge({ children, field, color, background, style }: BadgeProps) {
  const badgeStyle: CSSProperties = {
    ...typography.tag,
    color,
    background,
    padding: background ? '10px 18px' : undefined,
    alignSelf: background ? 'flex-start' : undefined,
    textTransform: 'uppercase',
    ...style,
  }
  if (field) return <PosterText as="div" style={badgeStyle} inline {...field} />
  return <div style={badgeStyle}>{children}</div>
}
