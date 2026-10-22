import { forwardRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { PosterShape } from '../types'
import { PosterShapeContext, SHAPE_SIZE } from '../posters/shape'

interface PosterScaledProps {
  // Szerokość na ekranie w px; wysokość wynika z proporcji kształtu.
  size: number
  shape?: PosterShape
  // Wysokość układu wyższa niż kształt (plakat, który urósł w dół - patrz
  // `grow` w PosterFrame). Bez niej pudełko ma wysokość kształtu, a nadmiar
  // jest przycięty (miniatury).
  layoutHeight?: number
  // Zgłasza zmierzoną wysokość układu, żeby rodzic mógł podać `layoutHeight`.
  onLayoutHeight?: (height: number) => void
  children: ReactNode
}

// Renderuje plakat w pełnym rozmiarze układu i pomniejsza go przez CSS
// transform do `size` px szerokości. Ref wskazuje na węzeł w pełnej
// rozdzielczości - to on jest przekazywany do html-to-image przy eksporcie.
// Ustawia też kontekst kształtu, z którego korzystają plakaty.
export const PosterScaled = forwardRef<HTMLDivElement, PosterScaledProps>(function PosterScaled(
  { size, shape = 'square', layoutHeight = 0, onLayoutHeight, children },
  innerRef,
) {
  const { width, height: shapeHeight } = SHAPE_SIZE[shape]
  const height = Math.max(shapeHeight, layoutHeight)
  const scale = size / width

  const nodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      const forward = (value: HTMLDivElement | null) => {
        if (typeof innerRef === 'function') innerRef(value)
        else if (innerRef) innerRef.current = value
      }
      forward(node)
      if (!node || !onLayoutHeight) return undefined
      // offsetHeight to wysokość układu - transform podglądu jej nie zmienia.
      const measure = () => onLayoutHeight(node.offsetHeight)
      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(node)
      // Gdy ref zwraca cleanup, React 19 nie woła go już z `null` - zerujemy
      // przekazany ref sami, żeby nie wskazywał odpiętego węzła.
      return () => {
        observer.disconnect()
        forward(null)
      }
    },
    [innerRef, onLayoutHeight],
  )

  return (
    <div style={{ width: size, height: height * scale, overflow: 'hidden', flex: '0 0 auto' }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div ref={nodeRef} style={{ width, minHeight: shapeHeight }}>
          <PosterShapeContext.Provider value={shape}>{children}</PosterShapeContext.Provider>
        </div>
      </div>
    </div>
  )
})
