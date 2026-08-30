import type { CSSProperties, ReactNode } from 'react'
import { LOGO_CLEAR } from '../theme'

interface LogoRowProps {
  gap?: number
  alignItems?: CSSProperties['alignItems']
  // Stała minimalna wysokość rzędu - stopka rezerwuje miejsce na kod QR
  // (QR_SLOT_H), żeby wpisanie linku nie rozpychało układu plakatu.
  minHeight?: number
  children: ReactNode
  style?: CSSProperties
}

// Rząd logo (LogoSlot, LogoSlots, QrSlot) w prawym dolnym rogu stopki.
//
// Ujednolicona pozycja we wszystkich szablonach: rząd jest wysunięty o pole
// ochronne (`-LOGO_CLEAR` w prawo i w dół), więc grafika - która wewnątrz
// slotu ma symetryczny padding `LOGO_CLEAR` - siada dokładnie na 72 px
// marginesie kadru (padding PosterFrame). Dzięki temu logo PK ląduje w tym
// samym miejscu na każdym plakacie, niezależnie od zawartości stopki.
//
// `flexWrap: wrap` - gdy grafik jest za dużo na jedną linię (np. hurtowo
// wgrane logotypy patronów), nadmiar schodzi do kolejnego wiersza zamiast
// wychodzić poza kadr plakatu.
export function LogoRow({ gap = LOGO_CLEAR, alignItems = 'flex-end', minHeight, children, style }: LogoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap,
        alignItems,
        minHeight,
        marginRight: -LOGO_CLEAR,
        marginBottom: -LOGO_CLEAR,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
