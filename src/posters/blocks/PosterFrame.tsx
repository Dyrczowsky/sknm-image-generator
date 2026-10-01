import type { CSSProperties, ReactNode } from 'react'
import { posterBaseStyle } from '../theme'
import { usePosterShape } from '../shape'

interface PosterFrameProps {
  vars?: Record<`--${string}`, string>
  padding?: number
  style?: CSSProperties
  children: ReactNode
}

// Wspólny kontener plakatu; wymiary z kształtu (1080×1080 / 1080×1528 /
// 1528×1080). `vars` to zmienne CSS ze schematu kolorów
// (resolveScheme(...).cssVars) — po ich rozlaniu każdy potomek może użyć
// `var(--rola)` w inline-style. `background`/`color` biorą się z CSS vars
// `--page-bg` / `--page-text`. `style` nadpisuje domyślny układ flex.
export function PosterFrame({ vars, padding = 0, style, children }: PosterFrameProps) {
  const { width, height } = usePosterShape()
  return (
    <div
      style={{
        width,
        height,
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
