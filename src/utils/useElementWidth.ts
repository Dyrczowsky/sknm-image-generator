import { useCallback, useState } from 'react'

// Szerokość treści elementu (px), śledzona przez ResizeObserver. Zwraca
// callback-ref do podpięcia i ostatnią zmierzoną szerokość (0 przed pomiarem).
export function useElementWidth<T extends HTMLElement>(): [(node: T | null) => void, number] {
  const [width, setWidth] = useState(0)
  const ref = useCallback((node: T | null) => {
    if (!node) return
    setWidth(node.clientWidth)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}
