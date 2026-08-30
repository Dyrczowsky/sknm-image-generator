import type { CSSProperties } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { LOGO_CLEAR, QR_SIZE } from '../theme'

interface QrSlotProps {
  // Link/tekst do zakodowania. Pusty = slot się nie renderuje (miejsce i tak
  // jest zarezerwowane w rzędzie stopki przez minHeight, patrz QR_SLOT_H).
  value: string
  // Bok kwadratu QR w skali plakatu (1080px).
  size?: number
  style?: CSSProperties
}

// Kod QR generowany na żywo z linku podanego w formularzu. Renderuje się na
// białym tle z marginesem (strefa cichości), żeby dało się go zeskanować
// niezależnie od koloru stopki. Kwadrat, zwykle pierwszy element rzędu stopki.
export function QrSlot({ value, size = QR_SIZE, style }: QrSlotProps) {
  if (!value.trim()) return null
  return (
    <div
      style={{
        flex: '0 0 auto',
        background: '#fff',
        padding: LOGO_CLEAR,
        display: 'flex',
        borderRadius: 4,
        ...style,
      }}
    >
      <QRCodeSVG value={value} size={size} marginSize={0} bgColor="#fff" fgColor="#121212" level="M" />
    </div>
  )
}
