import type { CSSProperties, ReactNode } from 'react'

interface LogoRowProps {
  gap?: number
  alignItems?: CSSProperties['alignItems']
  // Stała minimalna wysokość rzędu - stopka rezerwuje miejsce na kod QR
  // (QR_SLOT_H), żeby wpisanie linku nie rozpychało układu plakatu.
  minHeight?: number
  children: ReactNode
  style?: CSSProperties
}

// Rząd logo (LogoSlot, LogoSlots, QrSlot) ze spójnym odstępem.
// `flexWrap: wrap` - gdy grafik jest za dużo na jedną linię (np. hurtowo
// wgrane logotypy patronów), nadmiar schodzi do kolejnego wiersza zamiast
// wychodzić poza kadr plakatu.
export function LogoRow({ gap = 16, alignItems, minHeight, children, style }: LogoRowProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems, minHeight, ...style }}>
      {children}
    </div>
  )
}
