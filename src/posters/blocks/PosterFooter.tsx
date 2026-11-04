import type { CSSProperties, ReactNode } from 'react'
import { LOGO_CLEAR, QR_SIZE } from '../theme'
import { FooterLogos } from './FooterLogos'
import type { LogoSlotSource } from './LogoSlots'
import { QrSlot } from './QrSlot'
import type { LogoVariant, QrPlacement, QrSide } from '../../types'

interface PosterFooterProps {
  qrUrl: string
  qrSide: QrSide
  // `inline` - kod w rzędzie stopki, `above` - we własnym wierszu nad nią.
  qrPlacement: QrPlacement
  qrSize?: number
  // Treść lewego rogu stopki (data, adres strony, etykieta...). Opcjonalna.
  lead?: ReactNode
  slots: LogoSlotSource[]
  variant?: LogoVariant
  slotStyle?: CSSProperties
  // Odstęp między elementami rzędu.
  gap?: number
  // Nadpisania rzędu (np. `justifyContent: 'center'` w wyśrodkowanym banerze).
  rowStyle?: CSSProperties
  // Nadpisania kolumny logotypów (domyślnie wypełnia resztę rzędu).
  logosStyle?: CSSProperties
  style?: CSSProperties
}

// Wspólna stopka wszystkich szablonów: [treść lewego rogu] ... [logotypy],
// plus kod QR w jednym z czterech miejsc - zawsze przyklejony do krawędzi
// kadru albo do logotypów, nigdy „gdzieś w środku" za tekstem:
//
//   inline + left   QR na lewym marginesie, treść stopki tuż za nim
//   inline + right  QR tuż przed logotypami
//   above  + left   własny wiersz nad stopką, przy lewym marginesie
//   above  + right  własny wiersz nad stopką, nad logotypami
//
// Wysunięcia o `LOGO_CLEAR` kładą moduły QR dokładnie na marginesie kadru,
// tak jak grafiki w FooterLogos (slot ma symetryczny padding `LOGO_CLEAR`).
export function PosterFooter({
  qrUrl, qrSide, qrPlacement, qrSize = QR_SIZE, lead, slots, variant, slotStyle, gap = 24, rowStyle, logosStyle, style,
}: PosterFooterProps) {
  const hasQr = qrUrl.trim() !== ''
  const above = hasQr && qrPlacement === 'above'
  const inlineLeft = hasQr && !above && qrSide === 'left'
  const inlineRight = hasQr && !above && qrSide === 'right'

  const row = (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap, ...rowStyle }}>
      {(inlineLeft || lead) && (
        <div data-footer-lead style={{ display: 'flex', alignItems: 'flex-end', gap, minWidth: 0, flex: '0 1 auto' }}>
          {inlineLeft && (
            // Lewy i dolny margines zjada padding slotu (moduły na krawędzi
            // kadru), prawy - żeby odstęp do tekstu był równy `gap`.
            <div data-qr-inline="left" style={{ display: 'flex', margin: `0 ${-LOGO_CLEAR}px ${-LOGO_CLEAR}px ${-LOGO_CLEAR}px` }}>
              <QrSlot value={qrUrl} size={qrSize} />
            </div>
          )}
          {lead}
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, minWidth: 0, ...logosStyle }}>
        <FooterLogos qrUrl={inlineRight ? qrUrl : ''} qrSize={qrSize} slots={slots} variant={variant} slotStyle={slotStyle} />
      </div>
    </div>
  )

  if (!above) return style ? <div style={style}>{row}</div> : row
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <div
        data-qr-row={qrSide}
        style={{
          display: 'flex',
          justifyContent: qrSide === 'left' ? 'flex-start' : 'flex-end',
          margin: qrSide === 'left' ? `0 0 0 ${-LOGO_CLEAR}px` : `0 ${-LOGO_CLEAR}px 0 0`,
        }}
      >
        <QrSlot value={qrUrl} size={qrSize} />
      </div>
      {row}
    </div>
  )
}
