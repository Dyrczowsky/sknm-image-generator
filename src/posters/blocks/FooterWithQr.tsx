import type { CSSProperties, ReactNode } from 'react'
import { LOGO_CLEAR, QR_SIZE } from '../theme'
import { QrSlot } from './QrSlot'
import type { QrSide } from '../../types'

interface FooterWithQrProps {
  qrUrl: string
  qrSide: QrSide
  // Rząd stopki (data + logotypy) - jego FooterLogos dostaje pusty `qrUrl`.
  children: ReactNode
  style?: CSSProperties
}

// Stopka szablonów, w których data dzieli rząd z logotypami (Gala, Wykład).
// Kod QR w tym rzędzie się nie mieści i przeskakiwał w zależności od długości
// tekstu, więc dostaje własny wiersz tuż nad stopką: nad datą (`left`) albo
// nad logotypami (`right`). Wysunięcie o `LOGO_CLEAR` kładzie moduły na
// marginesie kadru, tak jak grafiki w FooterLogos.
export function FooterWithQr({ qrUrl, qrSide, children, style }: FooterWithQrProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {qrUrl.trim() && (
        <div
          style={{
            display: 'flex',
            justifyContent: qrSide === 'left' ? 'flex-start' : 'flex-end',
            margin: qrSide === 'left' ? `0 0 0 ${-LOGO_CLEAR}px` : `0 ${-LOGO_CLEAR}px 0 0`,
          }}
        >
          <QrSlot value={qrUrl} size={QR_SIZE} pushLeft={false} />
        </div>
      )}
      {children}
    </div>
  )
}
