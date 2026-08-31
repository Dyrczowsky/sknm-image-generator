import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { typography } from '../theme'

export interface InfoLinePart {
  text: string | null | undefined | false
  hidden?: boolean
}

type RawPart = string | null | undefined | false | InfoLinePart

interface InfoLineProps {
  parts: ReadonlyArray<RawPart>
  secondLine?: ReactNode
  secondLineHidden?: boolean
  separator?: string
  style?: CSSProperties
}

function normalize(part: RawPart): InfoLinePart {
  return typeof part === 'object' && part !== null ? part : { text: part, hidden: false }
}

// Łączy część danych (np. godzinę i lokalizację) wspólnym separatorem,
// z opcjonalną drugą linią (np. opisem). Puste oraz ukryte (`hidden`)
// elementy są w całości pomijane - nie renderują się i nie zajmują miejsca,
// a osierocone separatory nie powstają. Gdy nie ma nic do pokazania, blok
// zwraca `null`.
export function InfoLine({ parts, secondLine, secondLineHidden, separator = ' · ', style }: InfoLineProps) {
  const visible = parts.map(normalize).filter((p) => Boolean(p.text) && !p.hidden)
  const showSecond = Boolean(secondLine) && !secondLineHidden
  if (visible.length === 0 && !showSecond) return null
  return (
    <div style={{ ...typography.body, ...style }}>
      {visible.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <span>{separator}</span>}
          <span>{part.text}</span>
        </Fragment>
      ))}
      {showSecond && (
        <>
          {visible.length > 0 && <br />}
          <span>{secondLine}</span>
        </>
      )}
    </div>
  )
}
