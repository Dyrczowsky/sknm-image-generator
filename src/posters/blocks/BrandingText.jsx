import { typography } from '../theme'

// Pionowy, wyrównany do prawej blok tekstu mono (np. nazwa koła/uczelni
// w rogu plakatu). `lines` to kolejne linie tekstu.
export function BrandingText({ lines, color, opacity, style }) {
  return (
    <div style={{ ...typography.branding, textAlign: 'right', color, opacity, ...style }}>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </div>
  )
}
