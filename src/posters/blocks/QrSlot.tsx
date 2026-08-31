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

// Kod QR generowany na żywo z linku podanego w formularzu. Tło ZAWSZE
// przezroczyste - moduły leżą wprost na plakacie. Domyślnie pierwszy element
// rzędu stopki, dociągnięty maksymalnie w lewo (`marginRight: auto`).
//
// Kolor modułów: rola `qr` ze schematu (`--qr`), a bez niej `var(--page-text)` -
// czyli konfigurowalny wyłącznie w `schemes.ts`, nie w edytorze.
export function QrSlot({ value, size = QR_SIZE, style }: QrSlotProps) {
  if (!value.trim()) return null
  return (
    <div
      style={{
        flex: '0 0 auto',
        padding: LOGO_CLEAR,
        display: 'flex',
        marginRight: 'auto',
        ...style,
      }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        marginSize={1}
        bgColor="transparent"
        fgColor="var(--qr, var(--page-text))"
        level="M"
      />
    </div>
  )
}
