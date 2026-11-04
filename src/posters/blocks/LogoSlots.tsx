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
  // Wysokość grafik (domyślnie LOGO_HEIGHT; PosterFooter dopasowuje do treści stopki).
  height?: number
  // Proporcja szerokość/wysokość grafiki `i` po wczytaniu (PosterFooter
  // dobiera z nich wysokość, przy której rząd się nie zawija).
  onRatio?: (i: number, ratio: number) => void
}

// Rząd grafik stopki. Każda renderuje się NA WYSOKOŚĆ (`height`), a jej
// wrapper dokłada wokół pole ochronne (`LOGO_CLEAR`) - wgrywane pliki nie mają
// własnego. Pusta tablica => brak dzieci.
export function LogoSlots({ slots, variant = 'light', slotStyle, height = LOGO_HEIGHT, onRatio }: LogoSlotsProps) {
  const pkLogo = variant === 'dark' ? pkLogoDark : pkLogoLight
  return (
    <>
      {slots.map((src, i) => (
        <div key={i} style={{ padding: LOGO_CLEAR, display: 'flex', alignItems: 'center', flex: '0 0 auto', ...slotStyle }}>
          <img
            src={src ?? pkLogo}
            alt="Logo"
            style={{ height, width: 'auto', display: 'block' }}
            // Proporcja z wymiarów na stronie, nie `naturalWidth` - SVG bez
            // własnych wymiarów ma tam wartość umowną.
            onLoad={onRatio && ((e) => {
              const img = e.currentTarget
              if (img.offsetHeight > 0) onRatio(i, img.offsetWidth / img.offsetHeight)
            })}
          />
        </div>
      ))}
    </>
  )
}
