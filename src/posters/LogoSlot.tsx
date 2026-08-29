import type { CSSProperties } from 'react'
import { pkLogoLight, pkLogoDark } from './logos'
import type { LogoSlotValue, LogoVariant } from '../types'

interface LogoSlotProps {
  logo?: LogoSlotValue
  variant?: LogoVariant
  width?: number
  height?: number
  style?: CSSProperties
}

// Miejsce na logo w plakacie: pokazuje logo wgrane przez użytkownika
// w formularzu, a w jego braku - domyślne logo PK dobrane pod jasne/ciemne
// tło. Jeśli slot jest wyłączony (checkbox "włącz" w formularzu), nic się
// nie renderuje - element całkowicie znika z plakatu.
export function LogoSlot({ logo, variant = 'light', width, height, style }: LogoSlotProps) {
  const enabled = logo?.enabled ?? true
  if (!enabled) return null

  const src = logo?.src || (variant === 'dark' ? pkLogoDark : pkLogoLight)
  return (
    <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <img src={src} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  )
}
