import type { CSSProperties } from 'react'
import { pkLogoLight, pkLogoDark } from './logos'
import type { LogoSlotValue, LogoVariant } from '../types'

// Wymóg brandowy PK: logo Politechniki nie może renderować się niżej niż 64px
// (w układzie plakatu 1080×1080 = w eksportowanym PNG).
export const MIN_LOGO_HEIGHT = 64

interface LogoSlotProps {
  logo?: LogoSlotValue
  variant?: LogoVariant
  height?: number
  style?: CSSProperties
}

// Miejsce na logo w plakacie: pokazuje logo wgrane przez użytkownika
// w formularzu, a w jego braku - domyślne logo PK dobrane pod jasne/ciemne
// tło. Logo renderuje się NA WYSOKOŚĆ (`height`, klampowane do min. 64px),
// szerokość dobiera się z proporcji. Jeśli slot jest wyłączony (checkbox
// "włącz" w formularzu), nic się nie renderuje.
export function LogoSlot({ logo, variant = 'light', height = MIN_LOGO_HEIGHT, style }: LogoSlotProps) {
  const enabled = logo?.enabled ?? true
  if (!enabled) return null

  const h = Math.max(height, MIN_LOGO_HEIGHT)
  const src = logo?.src || (variant === 'dark' ? pkLogoDark : pkLogoLight)
  return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', flex: '0 0 auto', ...style }}>
      <img src={src} alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }} />
    </div>
  )
}
