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
export const BANNER_QR_H = BANNER_QR + LOGO_CLEAR * 2

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
