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

// Proporcje pliku PK_POZIOM (viewBox 5876×1772). Pusty, zarezerwowany slot
// rezerwuje tyle szerokości, ile zająłby wpisany w niego lockup PK - dzięki
// temu rząd 2 slotów ma tę samą szerokość niezależnie od tego, ile jest
// wypełnionych.
const PK_ASPECT = 5876 / 1772

interface LogoSlotProps {
  logo?: LogoSlotValue
  variant?: LogoVariant
  height?: number
  // `false` → w braku wgranego pliku NIE pokazuj domyślnego logo PK.
  // Zamiast tego slot renderuje pusty, zarezerwowany kwadrat (`height`×`height`),
  // żeby układ stopki nie skakał między "0 grafik" a "1 grafiką".
  fallback?: boolean
  style?: CSSProperties
}

// Miejsce na grafikę w plakacie: pokazuje plik wgrany przez użytkownika,
// a w jego braku - domyślne logo PK (chyba że `fallback={false}` - wtedy
// puste, zarezerwowane miejsce). Grafika renderuje się NA WYSOKOŚĆ
// (`height`, klampowane do MIN_LOGO_HEIGHT), szerokość z proporcji.
// Slot wyłączony checkboxem w formularzu - nic nie renderuje (bez rezerwacji).
export function LogoSlot({ logo, variant = 'light', height = MIN_LOGO_HEIGHT, fallback = true, style }: LogoSlotProps) {
  const enabled = logo?.enabled ?? true
  if (!enabled) return null

  const h = Math.max(height, MIN_LOGO_HEIGHT)
  if (!logo?.src && !fallback) {
    // Zarezerwowane, przezroczyste miejsce - bez `style` (żeby np. tło
    // `slot-bg` nie zrobiło z pustego slotu widocznego kwadratu).
    return <div style={{ height: h, width: Math.round(h * PK_ASPECT), flex: '0 0 auto' }} />
  }

  const src = logo?.src || (variant === 'dark' ? pkLogoDark : pkLogoLight)
  return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', flex: '0 0 auto', ...style }}>
      <img src={src} alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }} />
    </div>
  )
}
