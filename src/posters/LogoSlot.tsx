import type { CSSProperties } from 'react'
import { pkLogoLight, pkLogoDark } from './logos'
import { LOGO_HEIGHT } from './theme'
import type { LogoSlotValue, LogoVariant } from '../types'

type Side = 't' | 'r' | 'b' | 'l'

interface LogoSlotProps {
  logo?: LogoSlotValue
  variant?: LogoVariant
  height?: number
  // `false` → gdy użytkownik nie wgrał własnego pliku, slot się nie renderuje
  // (zamiast pokazywać domyślne logo PK). Używane dla slotu logo wydziału,
  // żeby nie dublować logo PK.
  fallback?: boolean
  // Strony przy krawędzi plakatu - tam pole ochronne pomijamy (nie odsuwamy
  // grafiki jeszcze raz od granicy, którą trzyma już padding PosterFrame).
  flush?: Side[]
  style?: CSSProperties
}

// Miejsce na grafikę w plakacie: pokazuje plik wgrany przez użytkownika,
// a w jego braku - domyślne logo PK (chyba że `fallback={false}`).
// Grafika renderuje się NA WYSOKOŚĆ (`height`), a wrapper dokłada wokół
// padding = pole ochronne (¼ wysokości). Slot wyłączony checkboxem w
// formularzu - nic nie renderuje.
export function LogoSlot({ logo, variant = 'light', height = LOGO_HEIGHT, fallback = true, flush = [], style }: LogoSlotProps) {
  const enabled = logo?.enabled ?? true
  if (!enabled) return null
  if (!logo?.src && !fallback) return null

  const h = Math.max(height, LOGO_HEIGHT)
  const pad = Math.round(h / 4)
  const src = logo?.src || (variant === 'dark' ? pkLogoDark : pkLogoLight)
  return (
    <div
      style={{
        paddingTop: flush.includes('t') ? 0 : pad,
        paddingRight: flush.includes('r') ? 0 : pad,
        paddingBottom: flush.includes('b') ? 0 : pad,
        paddingLeft: flush.includes('l') ? 0 : pad,
        display: 'flex',
        alignItems: 'center',
        flex: '0 0 auto',
        ...style,
      }}
    >
      <img src={src} alt="Logo" style={{ height: h, width: 'auto', display: 'block' }} />
    </div>
  )
}
