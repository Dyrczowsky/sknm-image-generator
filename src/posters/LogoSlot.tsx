import type { CSSProperties } from 'react'
import { pkLogoLight, pkLogoDark } from './logos'
import type { LogoSlotValue, LogoVariant } from '../types'

// Wysokość obrazka logo (skala plakatu 1080px, skaluje się proporcjonalnie
// przy eksporcie). Wokół obrazka dokładamy margines = ¼ jego wysokości
// z każdej strony (pole ochronne wg księgi znaku PK, s. 6).
export const MIN_LOGO_HEIGHT = 48

interface LogoSlotProps {
  logo?: LogoSlotValue
  variant?: LogoVariant
  height?: number
  // `false` → gdy użytkownik nie wgrał własnego pliku, slot się nie renderuje
  // (zamiast pokazywać domyślne logo PK). Używane dla slotu logo wydziału,
  // żeby nie dublować logo PK.
  fallback?: boolean
  style?: CSSProperties
}

// Miejsce na logo w plakacie: pokazuje logo wgrane przez użytkownika
// w formularzu, a w jego braku - domyślne logo PK dobrane pod jasne/ciemne
// tło (chyba że `fallback={false}`). Logo renderuje się NA WYSOKOŚĆ
// (`height`, klampowane do MIN_LOGO_HEIGHT), szerokość dobiera się z proporcji;
// wokół idzie margines = ¼ wysokości logo (pole ochronne).
// Slot wyłączony checkboxem w formularzu - nic nie renderuje.
export function LogoSlot({ logo, variant = 'light', height = MIN_LOGO_HEIGHT, fallback = true, style }: LogoSlotProps) {
  const enabled = logo?.enabled ?? true
  if (!enabled) return null
  if (!logo?.src && !fallback) return null

  const h = Math.max(height, MIN_LOGO_HEIGHT)
  const src = logo?.src || (variant === 'dark' ? pkLogoDark : pkLogoLight)
  return (
    <div style={{ height: h, margin: Math.round(h / 4), display: 'flex', alignItems: 'center', flex: '0 0 auto', ...style }}>
      <img src={src} alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }} />
    </div>
  )
}
