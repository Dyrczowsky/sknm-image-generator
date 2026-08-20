import { placeholderBoxStyle } from './theme'

// Puste miejsce na logo/kod QR, który użytkownik może później podmienić
// ręcznie w pliku graficznym (nie jest częścią danych z formularza).
export function PlaceholderBox({ label, width, height, style }) {
  return (
    <div style={{ ...placeholderBoxStyle, width, height, ...style }}>
      {label}
    </div>
  )
}
