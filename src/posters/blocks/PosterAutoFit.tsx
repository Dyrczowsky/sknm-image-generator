import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { contentOverflows, findFitFactor } from '../../utils/fitFactor'
import { usePosterEdit } from '../edit'
import { wholeLinesHeight } from './posterFit'

export interface PosterAutoFitProps {
  children: ReactNode
  // Pudełko o ograniczonej wysokości, np. `flex: 1, minHeight: 0`.
  style?: CSSProperties
  // Najmniejszy mnożnik fontu (domyślnie 0,7).
  min?: number
  // Ostrzeżenie w edytorze, gdy treść nie mieści się nawet przy `min`.
  notice: string
}

// Gdy treść nie mieści się nawet przy minimum, ucinamy ją na granicy wiersza
// (`clip-path` nie zmienia układu), żeby nad stopką nie wisiał pół-wiersz.
// Wysokość wiersza bierzemy z pierwszego dziecka (np. akapitu opisu).
function clipToWholeLines(el: HTMLElement, overflowing: boolean) {
  const child = el.firstElementChild
  if (!overflowing || !(child instanceof HTMLElement)) {
    el.style.removeProperty('clip-path')
    return
  }
  const cs = getComputedStyle(child)
  const top = child.offsetTop + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0)
  const box = el.clientHeight
  const visible = wholeLinesHeight(box, top, parseFloat(cs.lineHeight))
  if (visible < box) el.style.setProperty('clip-path', `inset(0 0 ${box - visible}px 0)`)
  else el.style.removeProperty('clip-path')
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
    clipToWholeLines(el, result.overflowing)
    state.current.size = `${el.clientWidth}x${el.clientHeight}`
    // Ostrzeżenie zgłaszamy tylko przy zmianie stanu (jak AutoFit w slajdach).
    if (result.overflowing !== state.current.overflowing) {
      state.current.overflowing = result.overflowing
      onNotice?.(result.overflowing ? notice : null)
    }
  }, [])

  // Po każdym renderze, przed malowaniem - bez mignięcia pełnego rozmiaru.
  useLayoutEffect(() => {
    latest.current = { min, notice, onNotice }
    measure()
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
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
    const current = state.current
    return () => {
      alive = false
      mutations.disconnect()
      resize.disconnect()
      // Przy odmontowaniu (i ponownym montowaniu) zdejmujemy ostrzeżenie.
      current.overflowing = false
      latest.current.onNotice?.(null)
    }
  }, [measure])

  return (
    <div ref={ref} style={{ position: 'relative', minHeight: 0, overflow: 'hidden', ...style, ['--fit' as string]: 1 }}>
      {children}
    </div>
  )
}
