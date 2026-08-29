import type { CSSProperties, ReactNode } from 'react'
import { colors, fontMono } from './theme'
import type { PhotoValue } from '../types'

interface PhotoGalleryProps {
  photos?: PhotoValue[]
  label?: ReactNode
  style?: CSSProperties
  placeholderStyle?: CSSProperties
  labelStyle?: CSSProperties
  children?: ReactNode
}

// Miejsce na zdjęcia w plakacie - jedno zdjęcie wypełnia cały kadr (jak
// dotychczas), a więcej niż jedno układa się w prostą siatkę wewnątrz tego
// samego kształtu (kadr/border-radius z `style` przycina siatkę tak samo,
// jak przycinał pojedyncze zdjęcie). Bez zdjęć - dotychczasowy placeholder.
// `children` (np. odznaka z logo nałożona na to miejsce) renderuje się
// zawsze, niezależnie od liczby zdjęć.
export function PhotoGallery({ photos, label, style, placeholderStyle, labelStyle, children }: PhotoGalleryProps) {
  const items = (photos ?? []).filter((p) => p?.src)

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {items.length === 0 && (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: `repeating-linear-gradient(135deg, ${colors.placeholderBg} 0 10px, ${colors.placeholderBgAlt} 10px 20px)`,
            display: 'grid',
            placeItems: 'center',
            boxSizing: 'border-box',
            ...placeholderStyle,
          }}
        >
          <div style={{ font: `400 22px ${fontMono}`, color: colors.placeholderText, textAlign: 'center', ...labelStyle }}>
            {label}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: items.length === 1 ? '1fr' : '1fr 1fr',
            gap: items.length === 1 ? 0 : 4,
          }}
        >
          {items.map((photo, i) => (
            <div
              key={i}
              style={{
                backgroundImage: `url(${photo.src})`,
                backgroundPosition: `${photo.x ?? 50}% ${photo.y ?? 50}%`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  )
}
