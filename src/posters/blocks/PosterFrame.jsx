import { posterBaseStyle } from '../theme'

// Wspólny kontener 1080x1080 z tłem/kolorem/paddingiem i domyślnym układem
// flex-column/space-between - powtarzający się szkielet każdego plakatu.
// `style` nadpisuje domyślny układ tam, gdzie dany szablon potrzebuje
// czegoś innego (np. pozycjonowania absolutnego zamiast flex).
export function PosterFrame({ background, color, padding = 0, style, children }) {
  return (
    <div
      style={{
        ...posterBaseStyle,
        background,
        color,
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
