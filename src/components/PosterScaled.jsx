import { forwardRef } from 'react'

const POSTER_SIZE = 1080

// Renderuje plakat (1080x1080) pomniejszony przez CSS transform do `size` px
// na ekranie. `innerRef` wskazuje na węzeł w pełnej rozdzielczości - to on
// jest przekazywany do html-to-image przy eksporcie do PNG.
export const PosterScaled = forwardRef(function PosterScaled({ size, children }, innerRef) {
  const scale = size / POSTER_SIZE
  return (
    <div style={{ width: size, height: size, overflow: 'hidden', flex: '0 0 auto' }}>
      <div style={{ width: POSTER_SIZE, height: POSTER_SIZE, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div ref={innerRef} style={{ width: POSTER_SIZE, height: POSTER_SIZE }}>
          {children}
        </div>
      </div>
    </div>
  )
})
