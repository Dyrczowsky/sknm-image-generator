import { useMemo } from 'react'
import { SlideEditContext } from '../../slides/defineSlide'
import type { SlideEdit } from '../../slides/defineSlide'
import type { ChangeMeta } from '../../richText'
import { SLIDE_SIZE } from '../../slides/shape'
import { SlideScaled } from '../../slides/SlideScaled'
import { SlideView } from '../../slides/SlideView'
import type { Deck, SlideAspect } from '../../slides/types'
import { fitWidth, stagePadding } from '../../utils/fit'
import { useElementSize } from '../../utils/useElementSize'
import { Icon } from '../ui'

interface SlideCanvasProps {
  deck: Deck
  selected: number
  aspect: SlideAspect
  // Czy zaznaczony slajd ma tekst, który się nie mieści.
  overflowing: boolean
  onText: (path: string, value: string, meta?: ChangeMeta) => void
  onOverflow: (slideId: string, id: string, overflowing: boolean) => void
}

// Szerokość slajdu, zanim scena zostanie zmierzona (SSR, pierwszy render).
const FALLBACK_WIDTH = 640

// Środek edytora: zaznaczony slajd dopasowany do sceny, z tekstem do
// edycji w miejscu. Tło sceny łapie fokus, żeby Delete usuwał slajd także
// po kliknięciu obok niego.
export function SlideCanvas({ deck, selected, aspect, overflowing, onText, onOverflow }: SlideCanvasProps) {
  const [stageRef, stage] = useElementSize<HTMLDivElement>()
  const slide = deck.slides[selected]
  const slideId = slide?.id
  const edit = useMemo<SlideEdit>(
    () => ({
      editable: true,
      onText,
      onOverflow: (id, value) => {
        if (slideId) onOverflow(slideId, `canvas:${id}`, value)
      },
    }),
    [onText, onOverflow, slideId],
  )
  const width = fitWidth(stage, SLIDE_SIZE[aspect], stagePadding(stage)) || FALLBACK_WIDTH

  return (
    <section aria-label="Slajd" className="flex min-h-0 min-w-0 flex-col bg-sunken">
      <div
        ref={stageRef}
        tabIndex={-1}
        data-deck-scope=""
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden outline-none max-[900px]:min-h-[min(60dvh,28rem)] max-[900px]:py-4"
        onPointerDown={(event) => {
          // Kliknięcie w tło (nie w tekst) zabiera fokus z pola i zostawia go na scenie.
          if (event.target === event.currentTarget) event.currentTarget.focus({ preventScroll: true })
        }}
      >
        {slide && (
          <div className="overflow-hidden rounded-[3px] shadow-[0_1px_3px_rgb(0_0_0/0.12),0_8px_28px_rgb(0_0_0/0.14)]">
            <SlideEditContext.Provider value={edit}>
              <SlideScaled width={width} aspect={aspect}>
                {/* `key` - przejście na inny slajd montuje pola od nowa (bez starego tekstu w DOM). */}
                <SlideView key={slide.id} deck={deck} slide={slide} index={selected} total={deck.slides.length} aspect={aspect} />
              </SlideScaled>
            </SlideEditContext.Provider>
          </div>
        )}
      </div>
      <div className="flex min-h-10 flex-none flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border bg-surface px-4 py-2 text-[0.8125rem] leading-snug" aria-live="polite">
        {overflowing ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-warning">
            <Icon name="warning" />
            Tekst się nie mieści — skróć go albo usuń element.
          </span>
        ) : (
          <span className="text-muted">Kliknij tekst na slajdzie, żeby go zmienić.</span>
        )}
      </div>
    </section>
  )
}
