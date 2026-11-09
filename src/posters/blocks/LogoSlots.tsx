import type { CSSProperties } from 'react'
import { pkLogos, sknmLogos } from '../logos'
import { LOGO_CLEAR, LOGO_HEIGHT } from '../theme'
import type { LogoVariant, PkLogoKind } from '../../types'

// Pozycja w stopce: `{ pk }` = logo PK (samo / z wydziałem / z katedrą),
// `{ sknm: true }` = logo SKNM, string = data URL wgranej grafiki.
export type LogoSlotSource = string | { pk: PkLogoKind } | { sknm: true }

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
  return (
    <>
      {slots.map((src, i) => (
        <div key={i} style={{ padding: LOGO_CLEAR, display: 'flex', alignItems: 'center', flex: '0 0 auto', ...slotStyle }}>
          <img
            src={typeof src === 'string' ? src : 'pk' in src ? pkLogos[src.pk][variant] : sknmLogos[variant]}
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
