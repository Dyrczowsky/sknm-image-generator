import type { CSSProperties } from 'react'
import { LOGO_CLEAR, QR_SIZE } from '../theme'
import { LogoSlots } from './LogoSlots'
import type { LogoSlotSource } from './LogoSlots'
import { QrSlot } from './QrSlot'
import type { LogoVariant } from '../../types'

interface FooterLogosProps {
  qrUrl: string
  slots: LogoSlotSource[]
  variant?: LogoVariant
  // Bok kwadratu kodu QR; banery podają mniejszy.
  qrSize?: number
  slotStyle?: CSSProperties
}

// Stopka plakatu: kod QR maksymalnie w lewo, logotypy w prawym dolnym rogu.
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
export function FooterLogos({ qrUrl, slots, variant, qrSize = QR_SIZE, slotStyle }: FooterLogosProps) {
  return (
    <div
      style={{
        // Wypełnia szerokość stopki i pakuje zawartość do prawej (logo w rogu).
        // QrSlot ma `marginRight: auto`, więc odbija się maksymalnie w lewo.
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: LOGO_CLEAR,
        alignItems: 'flex-end',
        minHeight: qrSize + LOGO_CLEAR * 2,
        marginRight: -LOGO_CLEAR,
        marginBottom: -LOGO_CLEAR,
      }}
    >
      <QrSlot value={qrUrl} size={qrSize} />
      <LogoSlots slots={slots} variant={variant} slotStyle={slotStyle} />
    </div>
  )
}
