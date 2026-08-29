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
// z opcjonalną drugą linią (np. opisem). Puste elementy są pomijane.
//
// Każda część (i każdy separator) renderuje się w osobnym <span> - ukrycie
// pola (`hidden`) daje mu `opacity: 0` bez zwijania szerokości. Separator
// znika, gdy któryś z jego sąsiadów jest ukryty, więc nie zostaje osierocony.
export function InfoLine({ parts, secondLine, secondLineHidden, separator = ' · ', style }: InfoLineProps) {
  const visible = parts.map(normalize).filter((p) => Boolean(p.text))
  return (
    <div style={{ ...typography.body, ...style }}>
      {visible.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span style={part.hidden || visible[i - 1].hidden ? { opacity: 0 } : undefined}>{separator}</span>
          )}
          <span style={part.hidden ? { opacity: 0 } : undefined}>{part.text}</span>
        </Fragment>
      ))}
      {secondLine && (
        <>
          <br />
          <span style={secondLineHidden ? { opacity: 0 } : undefined}>{secondLine}</span>
        </>
      )}
    </div>
  )
}
