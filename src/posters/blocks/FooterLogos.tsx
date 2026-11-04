import type { CSSProperties } from 'react'
import { LOGO_CLEAR, LOGO_HEIGHT } from '../theme'
import { LogoSlots } from './LogoSlots'
import type { LogoSlotSource } from './LogoSlots'
import { QrSlot } from './QrSlot'
import type { LogoVariant } from '../../types'

interface FooterLogosProps {
  qrUrl: string
  slots: LogoSlotSource[]
  variant?: LogoVariant
  // Wysokość grafik (domyślnie LOGO_HEIGHT).
  logoHeight?: number
  // Bok kwadratu kodu QR (domyślnie wysokość logo).
  qrSize?: number
  slotStyle?: CSSProperties
  onRatio?: (i: number, ratio: number) => void
  // Rząd na całą szerokość stopki (spiętrzona stopka): grafiki od lewego do
  // prawego marginesu kadru, wolne miejsce równo między nimi.
  spread?: boolean
}

// Logotypy w prawym dolnym rogu stopki, z kodem QR tuż przed nimi (gdy
// `qrUrl` niepusty). Resztę stopki - treść, QR po lewej - składa PosterFooter.
//
// Ujednolicona pozycja we wszystkich szablonach: rząd jest wysunięty o pole
// ochronne (`-LOGO_CLEAR` w prawo i w dół), więc grafika - która wewnątrz
// slotu ma symetryczny padding `LOGO_CLEAR` - siada dokładnie na marginesie
// kadru (padding PosterFrame). Dzięki temu logo PK ląduje w tym samym miejscu
// na każdym plakacie, niezależnie od zawartości stopki.
//
// `minHeight` rezerwuje na stałe wysokość slotu QR, żeby wpisanie linku nie
// rozpychało układu - QR pojawia się w miejscu, które i tak jest już puste.
// `flexWrap: wrap` - nadmiar grafik (np. hurtowo wgrane logotypy patronów)
// schodzi do kolejnego wiersza zamiast wychodzić poza kadr.
export function FooterLogos({ qrUrl, slots, variant, logoHeight = LOGO_HEIGHT, qrSize = logoHeight, slotStyle, onRatio, spread = false }: FooterLogosProps) {
  return (
    <div
      style={{
        // Wypełnia szerokość stopki i pakuje zawartość do prawej (logo w rogu).
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: spread ? 'space-between' : 'flex-end',
        gap: LOGO_CLEAR,
        // Logo i kod QR o różnej wysokości - wspólny środek (patrz PosterFooter).
        alignItems: 'center',
        minHeight: Math.max(qrSize, logoHeight) + LOGO_CLEAR * 2,
        marginRight: -LOGO_CLEAR,
        // Jak z prawej: pole ochronne pierwszej grafiki wychodzi na margines kadru.
        ...(spread && { marginLeft: -LOGO_CLEAR }),
        // Pole ochronne wysunięte w pionie po równo: środek rzędu to środek
        // grafik, a najwyższa siada dokładnie na dolnym marginesie kadru.
        marginTop: -LOGO_CLEAR,
        marginBottom: -LOGO_CLEAR,
      }}
    >
      <QrSlot value={qrUrl} size={qrSize} />
      <LogoSlots slots={slots} variant={variant} slotStyle={slotStyle} height={logoHeight} onRatio={onRatio} />
    </div>
  )
}
