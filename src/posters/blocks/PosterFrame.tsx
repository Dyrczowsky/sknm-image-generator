import type { CSSProperties, ReactNode } from 'react'
import { posterBaseStyle } from '../theme'
import { usePosterShape } from '../shape'

interface PosterFrameProps {
  vars?: Record<`--${string}`, string>
  padding?: number
  style?: CSSProperties
  // Kwadrat może urosnąć w dół, gdy treść się nie mieści (wysokość = co
  // najmniej kwadrat). Papier i banery mają stały rozmiar, więc tam nic nie
  // zmienia.
  grow?: boolean
  children: ReactNode
}

// Wspólny kontener plakatu; wymiary z kształtu (1080×1080 / 1080×1528 /
// 1528×1080). `vars` to zmienne CSS ze schematu kolorów
// (resolveScheme(...).cssVars) — po ich rozlaniu każdy potomek może użyć
// `var(--rola)` w inline-style. `background`/`color` biorą się z CSS vars
// `--page-bg` / `--page-text`. `style` nadpisuje domyślny układ flex.
export function PosterFrame({ vars, padding = 0, style, grow = false, children }: PosterFrameProps) {
  const { shape, width, height } = usePosterShape()
  const stretch = grow && shape === 'square'
  return (
    <div
      style={{
        width,
        ...(stretch ? { minHeight: height } : { height }),
        ...posterBaseStyle,
        ...vars,
        background: 'var(--page-bg)',
        color: 'var(--page-text)',
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
