import type { CSSProperties, ReactNode } from 'react'
import { placeholderBoxStyle } from './theme'

interface PlaceholderBoxProps {
  label?: ReactNode
  width?: number
  height?: number
  style?: CSSProperties
}

// Puste miejsce na logo/kod QR, który użytkownik może później podmienić
// ręcznie w pliku graficznym (nie jest częścią danych z formularza).
export function PlaceholderBox({ label, width, height, style }: PlaceholderBoxProps) {
  return (
    <div style={{ ...placeholderBoxStyle, width, height, ...style }}>
      {label}
    </div>
  )
}
