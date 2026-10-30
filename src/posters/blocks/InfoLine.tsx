import { Fragment } from 'react'
import type { CSSProperties } from 'react'
import { toPlain } from '../../richText'
import { typography } from '../theme'
import { PosterText } from './PosterText'
import type { PosterTextProps } from './PosterText'

// Pole formularza w linii - edytowalne na podglądzie (`PosterText`), zawsze
// `inline` (bez wyrównań). `multiline` dla pól, w których Enter łamie wiersz.
export type InfoLineField = Pick<PosterTextProps, 'path' | 'value' | 'fallback' | 'label' | 'multiline'>

export interface InfoLinePart {
  // Stały tekst (np. godzina) albo `field` - pole edytowalne na plakacie.
  text?: string | null | undefined | false
  field?: InfoLineField
  hidden?: boolean
}

type RawPart = string | null | undefined | false | InfoLinePart

interface InfoLineProps {
  parts: ReadonlyArray<RawPart>
  // Styl tylko na `parts` (np. suwak rozmiaru tekstu, gdy to pole niesie
  // podtytuł - patrz PosterData, gdzie `subtitle` jedzie w `parts`, nie w
  // `secondLine`). Domyślnie dziedziczy ze `style` na kontenerze.
  partsStyle?: CSSProperties
  secondLine?: InfoLineField
  secondLineHidden?: boolean
  // Styl tylko na `secondLine` (np. PosterWyklad, gdzie `subtitle` jedzie
  // jako `secondLine`, a `parts` to godzina/lokalizacja).
  secondLineStyle?: CSSProperties
  separator?: string
  style?: CSSProperties
}

function normalize(part: RawPart): InfoLinePart {
  return typeof part === 'object' && part !== null ? part : { text: part, hidden: false }
}

// Pole ma co pokazać: tekst (bez samych znaczników formatu) albo wartość zastępczą.
const hasText = (field: InfoLineField) => toPlain(field.value ?? '') !== '' || Boolean(field.fallback)

const Text = ({ field, style }: { field: InfoLineField; style?: CSSProperties }) => (
  <PosterText as="span" style={style} inline {...field} />
)

// Łączy część danych (np. godzinę i lokalizację) wspólnym separatorem,
// z opcjonalną drugą linią (np. opisem). Puste oraz ukryte (`hidden`)
// elementy są w całości pomijane - nie renderują się i nie zajmują miejsca,
// a osierocone separatory nie powstają. Gdy nie ma nic do pokazania, blok
// zwraca `null`.
export function InfoLine({ parts, partsStyle, secondLine, secondLineHidden, secondLineStyle, separator = ' · ', style }: InfoLineProps) {
  const visible = parts.map(normalize).filter((p) => (p.field ? hasText(p.field) : Boolean(p.text)) && !p.hidden)
  const showSecond = Boolean(secondLine && hasText(secondLine)) && !secondLineHidden
  if (visible.length === 0 && !showSecond) return null
  return (
    <div style={{ ...typography.body, ...style }}>
      {visible.length > 0 && (
        <span style={partsStyle}>
          {visible.map((part, i) => (
            <Fragment key={i}>
              {i > 0 && <span>{separator}</span>}
              {part.field ? <Text field={part.field} /> : <span>{part.text}</span>}
            </Fragment>
          ))}
        </span>
      )}
      {showSecond && secondLine && (
        <>
          {visible.length > 0 && <br />}
          <Text field={secondLine} style={secondLineStyle} />
        </>
      )}
    </div>
  )
}
