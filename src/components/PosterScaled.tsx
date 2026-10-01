import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import type { PosterShape } from '../types'
import { PosterShapeContext, SHAPE_SIZE } from '../posters/shape'

interface PosterScaledProps {
  // Szerokość na ekranie w px; wysokość wynika z proporcji kształtu.
  size: number
  shape?: PosterShape
  children: ReactNode
}

// Renderuje plakat w pełnym rozmiarze układu i pomniejsza go przez CSS
// transform do `size` px szerokości. `innerRef` wskazuje na węzeł w pełnej
// rozdzielczości - to on jest przekazywany do html-to-image przy eksporcie.
export const PosterScaled = forwardRef<HTMLDivElement, PosterScaledProps>(function PosterScaled({ size, shape = 'square', children }, innerRef) {
  const { width, height } = SHAPE_SIZE[shape]
  const scale = size / width
  return (
    <div style={{ width: size, height: height * scale, overflow: 'hidden', flex: '0 0 auto' }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div ref={innerRef} style={{ width, height }}>
          <PosterShapeContext.Provider value={shape}>{children}</PosterShapeContext.Provider>
        </div>
      </div>
    </div>
  )
})
