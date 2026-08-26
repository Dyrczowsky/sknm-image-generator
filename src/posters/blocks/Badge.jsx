import { typography } from '../theme'

// Plakietka/tag mono z letter-spacingiem. Podaj `background`, żeby dostać
// wypełnioną pigułkę (jak "WYKŁAD OTWARTY") - bez niego to sam kolorowy
// napis (jak "SEMINARIUM SKNM" w niektórych szablonach).
export function Badge({ children, color, background, style }) {
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
