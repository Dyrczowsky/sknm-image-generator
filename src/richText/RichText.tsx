import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { hasAlignment, isRich, parseRich } from './format'
import type { RichLine } from './format'
import { runStyle } from './runStyle'

export interface RichTextProps {
  value: string
  // Pole w linii (InfoLine, pigułki, plakietki): wyrównania ignorowane, nigdy bloki.
  inline?: boolean
}

function Runs({ line }: { line: RichLine }) {
  return (
    <>
      {line.runs.map((r, i) => {
        const style = runStyle(r.marks)
        return style ? <span key={i} style={style}>{r.text}</span> : <Fragment key={i}>{r.text}</Fragment>
      })}
    </>
  )
}

/** Rysuje tekst z formatowaniem (tylko do odczytu); zwykły string jako sam tekst. */
export function RichText({ value, inline }: RichTextProps): ReactNode {
  if (!isRich(value)) return value
  const doc = parseRich(value)
  if (hasAlignment(doc) && !inline) {
    return (
      <>
        {doc.map((line, i) => (
          <div key={i} style={line.align === 'left' ? undefined : { textAlign: line.align }}>
            {line.runs.length ? <Runs line={line} /> : <br />}
          </div>
        ))}
      </>
    )
  }
  return (
    <>
      {doc.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && '\n'}
          <Runs line={line} />
        </Fragment>
      ))}
    </>
  )
}
