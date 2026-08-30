import type { CSSProperties } from 'react'
import { pkLogoLight, pkLogoDark } from './logos'
import type { LogoSlotValue, LogoVariant } from '../types'

// Wymóg z księgi znaku PK (bip.malopolska.pl/api/files/4204586, s. 7):
// minimalna wielkość znaku w zastosowaniach cyfrowych to 64px. Znak jest
// wpisany w kwadrat i w pliku PK_POZIOM.svg zajmuje 0.666 wysokości viewBoxa
// (reszta to pole ochronne = ¼ wysokości znaku z każdej strony, s. 6).
// 64 / 0.666 ≈ 96 → to jest DOLNY limit; renderujemy dokładnie na minimum.
// Wartość jest w skali plakatu 1080px i skaluje się proporcjonalnie
// przy eksporcie do większych rozdzielczości.
export const MIN_LOGO_HEIGHT = 96

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
// (`height`, klampowane do MIN_LOGO_HEIGHT), szerokość dobiera się z proporcji.
// Slot wyłączony checkboxem w formularzu - nic nie renderuje.
export function LogoSlot({ logo, variant = 'light', height = MIN_LOGO_HEIGHT, fallback = true, style }: LogoSlotProps) {
  const enabled = logo?.enabled ?? true
  if (!enabled) return null
  if (!logo?.src && !fallback) return null

  const h = Math.max(height, MIN_LOGO_HEIGHT)
  const src = logo?.src || (variant === 'dark' ? pkLogoDark : pkLogoLight)
  return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', flex: '0 0 auto', ...style }}>
      <img src={src} alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }} />
    </div>
  )
}
