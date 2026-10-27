import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { SLIDE_SIZE } from './shape'
import type { SlideAspect } from './types'

interface SlideScaledProps {
  // Szerokość na ekranie w px; wysokość wynika z formatu.
  width: number
  aspect: SlideAspect
  children: ReactNode
}

// Slajd w pełnym rozmiarze układu (SLIDE_SIZE) pomniejszony przez CSS
// transform do `width` px - jak PosterScaled dla plakatów. Ref wskazuje węzeł
// w pełnej rozdzielczości (do eksportu).
export const SlideScaled = forwardRef<HTMLDivElement, SlideScaledProps>(function SlideScaled({ width, aspect, children }, ref) {
  const size = SLIDE_SIZE[aspect]
  const scale = width / size.width
  return (
    <div style={{ width, height: size.height * scale, overflow: 'hidden', flex: '0 0 auto', position: 'relative' }}>
      <div ref={ref} style={{ width: size.width, height: size.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
})
