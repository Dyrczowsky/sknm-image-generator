import { QRCodeSVG } from 'qrcode.react'
import { LOGO_CLEAR } from '../theme'

interface QrSlotProps {
  // Link/tekst do zakodowania. Pusty = slot się nie renderuje (miejsce i tak
  // jest zarezerwowane w rzędzie stopki, patrz FooterLogos i PosterFooter).
  value: string
  // Bok kwadratu QR w skali plakatu.
  size: number
  // Pole ochronne wokół kodu (domyślnie LOGO_CLEAR; w druku większe).
  clear?: number
}

// Kod QR generowany na żywo z linku podanego w formularzu. Tło ZAWSZE
// przezroczyste - moduły leżą wprost na plakacie. Gdzie stoi w stopce,
// decyduje PosterFooter.
//
// Kolor modułów: rola `qr` ze schematu (`--qr`), a bez niej `var(--page-text)` -
// czyli konfigurowalny wyłącznie w `schemes.ts`, nie w edytorze.
export function QrSlot({ value, size, clear = LOGO_CLEAR }: QrSlotProps) {
  if (!value.trim()) return null
  return (
    <div style={{ flex: '0 0 auto', padding: clear, display: 'flex' }}>
      <QRCodeSVG value={value} size={size} marginSize={1} bgColor="transparent" fgColor="var(--qr, var(--page-text))" level="M" />
    </div>
  )
}
