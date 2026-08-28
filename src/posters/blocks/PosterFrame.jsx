import { posterBaseStyle } from '../theme'

// Wspólny kontener 1080×1080. `vars` to zmienne CSS ze schematu kolorów
// (resolveScheme(...).cssVars) — po ich rozlaniu każdy potomek może użyć
// `var(--rola)` w inline-style. `background`/`color` domyślnie biorą się z
// `--page-bg` / `--page-text`; jawne propsy (starszy wariant, przed migracją
// danego layoutu) mają pierwszeństwo. `style` nadpisuje domyślny układ flex.
export function PosterFrame({ vars, background, color, padding = 0, style, children }) {
  return (
    <div
      style={{
        ...posterBaseStyle,
        ...vars,
        background: background ?? 'var(--page-bg)',
        color: color ?? 'var(--page-text)',
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
