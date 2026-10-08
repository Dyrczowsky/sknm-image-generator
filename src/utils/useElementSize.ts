import { useCallback, useState } from 'react'
import type { Size } from './fit'

const UNMEASURED: Size = { width: 0, height: 0 }

// Rozmiar elementu (px, bez ramki), śledzony przez ResizeObserver. Zwraca
// callback-ref do podpięcia i ostatni pomiar (0×0 przed pierwszym).
// Pierwszy pomiar zapada synchronicznie przy podpięciu, więc treść zależna od
// rozmiaru nie mignie w rozmiarze zastępczym. Pomiar zerowy jest pomijany:
// element ukryty (`hidden`, `display: none`) zachowuje ostatni rozmiar, a po
// odsłonięciu nie przeskakuje.
export function useElementSize<T extends HTMLElement>(): [(node: T | null) => (() => void) | undefined, Size] {
  const [size, setSize] = useState<Size>(UNMEASURED)
  const ref = useCallback((node: T | null) => {
    if (!node) return undefined
    const measure = () => {
      const width = node.clientWidth
      const height = node.clientHeight
      if (width === 0 || height === 0) return
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}
