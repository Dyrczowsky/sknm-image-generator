// Wysokość tekstu „na oko": od wierzchołka wielkich liter pierwszej linijki
// do linii bazowej ostatniej - bez interlinii nad i pod tekstem, którą ma
// pudełko elementu. Stopka plakatu dopasowuje do niej logo i kod QR, żeby
// nie wychodziły wyżej ani niżej niż sam tekst.
//
// Linijki to prostokąty `Range.getClientRects()` (obszar treści fontu: od
// górnej do dolnej krawędzi fontu), a odległości krawędź→wierzchołek liter
// i krawędź→linia bazowa dają metryki fontu z `canvas.measureText`. Wynik
// w px układu (bez skali podglądu). `null`, gdy w elemencie nie ma tekstu
// albo przeglądarka nie daje metryk (testy, render statyczny).

let context: CanvasRenderingContext2D | null | undefined

function canvasContext(): CanvasRenderingContext2D | null {
  if (context === undefined) {
    try {
      context = document.createElement('canvas').getContext('2d')
    } catch {
      context = null
    }
  }
  return context
}

export function textInkHeight(element: HTMLElement): number | null {
  const ctx = canvasContext()
  if (!ctx || typeof document.createRange !== 'function') return null
  const box = element.getBoundingClientRect()
  // Podgląd jest skalowany transformacją - prostokąty są w px ekranu.
  const scale = element.offsetHeight > 0 ? box.height / element.offsetHeight : 1
  if (!(scale > 0)) return null

  let top = Infinity
  let bottom = -Infinity
  const range = document.createRange()
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement
    if (!parent || !node.textContent?.trim()) continue
    const style = getComputedStyle(parent)
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const metrics = ctx.measureText('H')
    const ascent = metrics.fontBoundingBoxAscent
    const cap = metrics.actualBoundingBoxAscent
    if (!(ascent > 0) || !(cap > 0)) continue
    range.selectNodeContents(node)
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.height === 0) continue
      const lineTop = (rect.top - box.top) / scale
      top = Math.min(top, lineTop + ascent - cap)
      bottom = Math.max(bottom, lineTop + ascent)
    }
  }
  return bottom > top ? bottom - top : null
}
