import { colors, fontMono } from './theme'

// Miejsce na zdjęcie w plakacie: pokazuje zdjęcie wgrane przez użytkownika
// (jako tło, więc respektuje kształt z `style` - clip-path, border-radius),
// a w jego braku - dotychczasowy szary placeholder z opisem.
// `style` opisuje kształt/rozmiar/pozycję pola (zawsze stosowany).
// `placeholderStyle` dotyczy tylko wyśrodkowania tekstu placeholdera, kiedy
// zdjęcie nie zostało jeszcze wgrane (np. dodatkowy padding przy skosach).
export function PhotoSlot({ photo, label, style, placeholderStyle, labelStyle, children }) {
  const src = photo?.src

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: src
          ? `url(${src}) ${photo.x ?? 50}% ${photo.y ?? 50}% / cover no-repeat`
          : `repeating-linear-gradient(135deg, ${colors.placeholderBg} 0 10px, ${colors.placeholderBgAlt} 10px 20px)`,
        ...style,
      }}
    >
      {!src && (
        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', boxSizing: 'border-box', ...placeholderStyle }}>
          <div style={{ font: `400 22px ${fontMono}`, color: colors.placeholderText, textAlign: 'center', ...labelStyle }}>{label}</div>
        </div>
      )}
      {children}
    </div>
  )
}
