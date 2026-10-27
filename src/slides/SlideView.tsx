import { SlideRenderContext } from './defineSlide'
import type { SlideRenderInfo } from './defineSlide'
import { layoutOf } from './komponenty'
import type { Deck, Slide, SlideAspect } from './types'

interface SlideViewProps {
  deck: Pick<Deck, 'theme'>
  slide: Slide
  index: number
  total: number
  aspect: SlideAspect
  // Bieżący krok pokazu; domyślnie wszystko widoczne.
  step?: number
}

// Rysuje jeden slajd w pełnym rozmiarze układu (SLIDE_SIZE). Skalowanie do
// ekranu robi rodzic. Edycję na slajdzie włącza `SlideEditContext` nad nim.
export function SlideView({ deck, slide, index, total, aspect, step = Infinity }: SlideViewProps) {
  const layout = layoutOf(slide.layout)
  if (!layout) return null
  const info: SlideRenderInfo = {
    aspect,
    theme: deck.theme,
    background: slide.background,
    mirrored: slide.mirrored,
    index,
    total,
    step: slide.reveal ? step : Infinity,
    reveal: slide.reveal,
  }
  // Brakujące pola (stary zapis, nowe pole układu) biorą wartość domyślną.
  const data = { ...layout.defaults, ...slide.data }
  return (
    <SlideRenderContext.Provider value={info}>
      <layout.Component data={data} />
    </SlideRenderContext.Provider>
  )
}
