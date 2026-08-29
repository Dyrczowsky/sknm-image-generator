import type { CSSProperties, ReactNode } from 'react'
import { typography } from '../theme'

interface InfoLineProps {
  parts: ReadonlyArray<string | null | undefined | false>
  secondLine?: ReactNode
  separator?: string
  style?: CSSProperties
}

// Łączy część danych (np. godzinę i lokalizację) wspólnym separatorem,
// z opcjonalną drugą linią (np. opisem). Puste elementy są pomijane.
export function InfoLine({ parts, secondLine, separator = ' · ', style }: InfoLineProps) {
  const line = parts.filter(Boolean).join(separator)
  return (
    <div style={{ ...typography.body, ...style }}>
      {line}
      {secondLine && <><br />{secondLine}</>}
    </div>
  )
}
