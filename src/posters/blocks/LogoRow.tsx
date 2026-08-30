import type { CSSProperties, ReactNode } from 'react'

interface LogoRowProps {
  gap?: number
  alignItems?: CSSProperties['alignItems']
  children: ReactNode
  style?: CSSProperties
}

// Rząd logo/placeholderów (LogoSlot, PlaceholderBox) ze spójnym odstępem.
// `flexWrap: wrap` - gdy grafik jest za dużo na jedną linię (np. hurtowo
// wgrane logotypy patronów), nadmiar schodzi do kolejnego wiersza zamiast
// wychodzić poza kadr plakatu.
export function LogoRow({ gap = 16, alignItems, children, style }: LogoRowProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems, ...style }}>
      {children}
    </div>
  )
}
