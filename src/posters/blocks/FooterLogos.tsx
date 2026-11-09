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
  // Pole ochronne (domyślnie LOGO_CLEAR; w druku większe, patrz logoSizing).
  clear?: number
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
export function FooterLogos({ qrUrl, slots, variant, logoHeight = LOGO_HEIGHT, qrSize = logoHeight, slotStyle, onRatio, spread = false, clear = LOGO_CLEAR }: FooterLogosProps) {
  return (
    <div
      style={{
        // Wypełnia szerokość stopki i pakuje zawartość do prawej (logo w rogu).
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: spread ? 'space-between' : 'flex-end',
        gap: clear,
        // Logo i kod QR o różnej wysokości - wspólny środek (patrz PosterFooter).
        alignItems: 'center',
        minHeight: Math.max(qrSize, logoHeight) + clear * 2,
        marginRight: -clear,
        // Jak z prawej: pole ochronne pierwszej grafiki wychodzi na margines kadru.
        ...(spread && { marginLeft: -clear }),
        // Pole ochronne wysunięte w pionie po równo: środek rzędu to środek
        // grafik, a najwyższa siada dokładnie na dolnym marginesie kadru.
        marginTop: -clear,
        marginBottom: -clear,
      }}
    >
      <QrSlot value={qrUrl} size={qrSize} clear={clear} />
      <LogoSlots slots={slots} variant={variant} slotStyle={slotStyle} height={logoHeight} onRatio={onRatio} clear={clear} />
    </div>
  )
}
