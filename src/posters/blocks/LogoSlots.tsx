import type { CSSProperties } from 'react'
import { pkLogoDark, pkLogoLight } from '../logos'
import { LOGO_CLEAR, LOGO_HEIGHT } from '../theme'
import type { LogoVariant } from '../../types'

// Pozycja w stopce: `null` = domyślne logo PK, string = data URL wgranej grafiki.
export type LogoSlotSource = string | null

interface LogoSlotsProps {
  // Kolejność = kolejność wyświetlania.
  slots: LogoSlotSource[]
  // Wariant logo PK pod tło plakatu (ze schematu kolorów).
  variant?: LogoVariant
  slotStyle?: CSSProperties
}

// Rząd grafik stopki. Każda renderuje się NA WYSOKOŚĆ (`LOGO_HEIGHT`), a jej
// wrapper dokłada wokół pole ochronne (`LOGO_CLEAR`) - wgrywane pliki nie mają
// własnego. Pusta tablica => brak dzieci.
export function LogoSlots({ slots, variant = 'light', slotStyle }: LogoSlotsProps) {
  const pkLogo = variant === 'dark' ? pkLogoDark : pkLogoLight
  return (
    <>
      {slots.map((src, i) => (
        <div key={i} style={{ padding: LOGO_CLEAR, display: 'flex', alignItems: 'center', flex: '0 0 auto', ...slotStyle }}>
          <img src={src ?? pkLogo} alt="Logo" style={{ height: LOGO_HEIGHT, width: 'auto', display: 'block' }} />
        </div>
      ))}
    </>
  )
}
