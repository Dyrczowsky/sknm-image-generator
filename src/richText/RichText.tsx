import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { MARK, hasAlignment, isRich, parseRich } from './format'
import type { RichLine } from './format'

export interface RichTextProps {
  value: string
  // Pole w linii (InfoLine, pigułki, plakietki): wyrównania ignorowane, nigdy bloki.
  inline?: boolean
}

/** Styl runu o danych znacznikach; undefined dla zwykłego tekstu. */
export function runStyle(marks: number): CSSProperties | undefined {
  const style: CSSProperties = {}
  if (marks & MARK.bold) style.fontWeight = 'bolder'
  if (marks & MARK.italic) style.fontStyle = 'italic'
  const lines = [marks & MARK.underline ? 'underline' : '', marks & MARK.strike ? 'line-through' : '']
    .filter(Boolean).join(' ')
  if (lines) style.textDecorationLine = lines
  if (marks & MARK.accent) style.color = 'var(--rich-accent, var(--accent))'
  return Object.keys(style).length ? style : undefined
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
