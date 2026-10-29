import { createElement } from 'react'
import type { CSSProperties, KeyboardEvent, ReactElement } from 'react'
import { RichEditable, RichText, toPlain } from '../../richText'
import type { EditableTag } from '../../richText'
import type { ListItem } from '../../types'
import { usePosterEdit } from '../edit'

export interface PosterTextProps {
  path: string
  // Surowa wartość z formularza (może być pusta).
  value: string | null | undefined
  // Wartość przykładowa / domyślna, gdy pole jest puste.
  fallback?: string
  as?: EditableTag
  style?: CSSProperties
  multiline?: boolean
  // Pole w linii: bez wyrównań.
  inline?: boolean
  // Wielkie litery przez CSS `text-transform` - zapis zostaje bez zmian.
  transform?: 'uppercase'
  // Dostępna nazwa edytora, np. „Tytuł".
  label: string
  // Pozycja listy (`lists.…`): lista, którą szablon rysuje, gdy w formularzu jej brak.
  listSeed?: ListItem[]
}

// Tekst plakatu, który na podglądzie w edytorze można kliknąć i zmienić.
export function PosterText(props: PosterTextProps): ReactElement {
  const { editable } = usePosterEdit()
  // Dwa osobne komponenty jak w slajdach: przełączenie trybu montuje element od nowa.
  return editable ? <EditableField {...props} /> : <StaticText {...props} />
}

function textStyle({ style, transform }: PosterTextProps): CSSProperties | undefined {
  return transform ? { ...style, textTransform: transform } : style
}

function StaticText(props: PosterTextProps): ReactElement {
  const { value, fallback, as = 'div', multiline, inline } = props
  // Pusty jak w edycji: bez widocznego tekstu (same znaczniki formatu też).
  const shown = toPlain(value ?? '') === '' ? fallback ?? '' : value ?? ''
  // Wyrównania tylko tam, gdzie pole w edycji je obsługuje (`alignable`).
  return createElement(as, { style: textStyle(props) }, <RichText value={shown} inline={inline || !multiline} />)
}

// Cofanie na plakacie nie działa w polu tekstowym (historia formularza jest
// gdzie indziej) - blokujemy je, zanim przeglądarka cofnie DOM pola.
function blockUndo(event: KeyboardEvent<HTMLElement>) {
  if (!(event.ctrlKey || event.metaKey)) return
  const key = event.key.toLowerCase()
  if (key === 'z' || key === 'y') {
    event.preventDefault()
    event.stopPropagation()
  }
}

function EditableField(props: PosterTextProps): ReactElement {
  const { onText } = usePosterEdit()
  const { path, value, fallback, as, multiline = false, inline = false, label, listSeed } = props
  return (
    <RichEditable
      value={value ?? ''}
      onChange={(v) => onText(path, v, listSeed)}
      as={as}
      style={textStyle(props)}
      multiline={multiline}
      alignable={multiline && !inline}
      placeholder={fallback}
      ariaLabel={label}
      marker="data-poster-edit"
      onKeyDownCapture={blockUndo}
    />
  )
}
