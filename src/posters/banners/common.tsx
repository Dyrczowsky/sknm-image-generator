import type { CSSProperties } from 'react'
import { LOGO_CLEAR } from '../theme'
import { LogoRow } from '../blocks/LogoRow'
import { LogoSlots } from '../blocks/LogoSlots'
import { QrSlot } from '../blocks/QrSlot'
import type { LogoVariant } from '../../types'

// Skala banera (wysokość układu 624 px): sygnet i kod QR są mniejsze niż na
// plakacie 1080 px, logotypy zostają na LOGO_HEIGHT (to ich minimum).
export const BANNER_SYGNET_W = 88
export const BANNER_QR = 72
// Światło między literami nazwy koła. Plakaty ściskają tytuły mocniej
// (-.035em), ale w długiej nazwie litery zaczynały się wtedy stykać.
export const NAME_TRACKING = '-.008em'
export const BANNER_QR_H = BANNER_QR + LOGO_CLEAR * 2

interface MarginChipsProps {
  // Szerokość bocznego marginesu poza bezpieczną kolumną (0 = brak marginesu).
  margin: number
  colors: [string, string, string]
}

// Dekoracja bocznych marginesów okładki strony: po obu stronach stos trzech
// trójkątów (motyw sygnetu). Marginesy są przycinane na telefonie, więc nie
// niosą treści; w banerze bez marginesu (wydarzenie) dekoracja znika.
export function MarginChips({ margin, colors }: MarginChipsProps) {
  if (margin < 120) return null
  const stack = (side: 'left' | 'right') => (
    <div style={{ position: 'absolute', top: 0, bottom: 0, [side]: 0, width: margin, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      {colors.map((background, i) => (
        <div key={i} style={{ width: 84, height: 70, background, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
      ))}
    </div>
  )
  return (
    <>
      {stack('left')}
      {stack('right')}
    </>
  )
}

interface BannerLogosProps {
  qrUrl: string
  slots: (string | null)[]
  variant?: LogoVariant
  slotStyle?: CSSProperties
  style?: CSSProperties
}

// Stopka banera: kod QR maksymalnie w lewo, logotypy w prawym dolnym rogu -
// ten sam komplet co w plakatach (LogoRow + QrSlot + LogoSlots). Wrapper
// jest flexem, bo LogoRow ma `flex: 1` i w kolumnie rozciągałby się w pionie.
export function BannerLogos({ qrUrl, slots, variant, slotStyle, style }: BannerLogosProps) {
  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, ...style }}>
      <LogoRow minHeight={BANNER_QR_H}>
        <QrSlot value={qrUrl} size={BANNER_QR} />
        <LogoSlots slots={slots} variant={variant} slotStyle={slotStyle} />
      </LogoRow>
    </div>
  )
}
