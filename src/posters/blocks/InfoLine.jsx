import { typography } from '../theme'

// Łączy część danych (np. godzinę i lokalizację) wspólnym separatorem,
// z opcjonalną drugą linią (np. opisem). Puste elementy są pomijane.
export function InfoLine({ parts, secondLine, separator = ' · ', style }) {
  const line = parts.filter(Boolean).join(separator)
  return (
    <div style={{ ...typography.body, ...style }}>
      {line}
      {secondLine && <><br />{secondLine}</>}
    </div>
  )
}
