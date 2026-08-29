import type { CSSProperties, ReactNode } from 'react'

interface LogoRowProps {
  gap?: number
  alignItems?: CSSProperties['alignItems']
  children: ReactNode
  style?: CSSProperties
}

// Rząd logo/placeholderów (LogoSlot, PlaceholderBox) ze spójnym odstępem.
export function LogoRow({ gap = 16, alignItems, children, style }: LogoRowProps) {
  return (
    <div style={{ display: 'flex', gap, alignItems, ...style }}>
      {children}
    </div>
  )
}
