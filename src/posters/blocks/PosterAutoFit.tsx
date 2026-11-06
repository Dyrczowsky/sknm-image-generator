import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { contentOverflows, findFitFactor } from '../../utils/fitFactor'
import { usePosterEdit } from '../edit'

// Rozmiar fontu, który zmniejsza PosterAutoFit: `fontSize: posterFit(30)`.
export function posterFit(px: number): string {
  return `calc(${px}px * var(--fit, 1))`
}

export interface PosterAutoFitProps {
  children: ReactNode
  // Pudełko o ograniczonej wysokości, np. `flex: 1, minHeight: 0`.
  style?: CSSProperties
  // Najmniejszy mnożnik fontu (domyślnie 0,7).
  min?: number
  // Ostrzeżenie w edytorze, gdy treść nie mieści się nawet przy `min`.
  notice: string
}

// Zmniejsza fonty potomków (podane przez `posterFit(px)`), aż treść zmieści
// się w pudełku. Odpowiednik AutoFit ze slajdów.
export function PosterAutoFit({ children, style, min = 0.7, notice }: PosterAutoFitProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { onNotice } = usePosterEdit()
  const latest = useRef({ min, notice, onNotice })
  const state = useRef({ overflowing: false, size: '' })

  // Mnożnik trafia prosto do `style` elementu, nie do stanu Reacta: eksport
  // (html-to-image) rasteryzuje żywy węzeł i widzi go w atrybucie `style`.
  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { min, notice, onNotice } = latest.current
    const result = findFitFactor((factor) => {
      el.style.setProperty('--fit', String(factor))
      return contentOverflows(el)
    }, min)
    el.style.setProperty('--fit', String(result.factor))
    state.current.size = `${el.clientWidth}x${el.clientHeight}`
    state.current.overflowing = result.overflowing
    onNotice?.(result.overflowing ? notice : null)
  }, [])

  // Po każdym renderze, przed malowaniem - bez mignięcia pełnego rozmiaru.
  useLayoutEffect(() => {
    latest.current = { min, notice, onNotice }
    measure()
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Pisanie w polu tekstowym zmienia DOM bez renderu Reacta.
    const mutations = new MutationObserver(() => measure())
    mutations.observe(el, { characterData: true, childList: true, subtree: true })
    const resize = new ResizeObserver(() => {
      if (`${el.clientWidth}x${el.clientHeight}` !== state.current.size) measure()
    })
    resize.observe(el)
    // Pierwszy pomiar mógł trafić na font zapasowy o innej szerokości.
    let alive = true
    document.fonts?.ready.then(() => {
      if (alive) measure()
    })
    return () => {
      alive = false
      mutations.disconnect()
      resize.disconnect()
    }
  }, [measure])

  useEffect(() => () => onNotice?.(null), [onNotice])

  return (
    <div ref={ref} style={{ position: 'relative', minHeight: 0, overflow: 'hidden', ...style, ['--fit' as string]: 1 }}>
      {children}
    </div>
  )
}
