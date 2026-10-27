import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { SlideView } from '../SlideView'
import { SLIDE_SIZE } from '../shape'
import type { Deck, SlideAspect } from '../types'

export interface OffscreenSlides {
  // Węzły slajdów w pełnym rozmiarze układu, w kolejności prezentacji.
  nodes: HTMLElement[]
  // Rysuje slajd `index` na kroku `step` (do kolejnych klatek „pokazuj po kolei").
  setStep: (index: number, step: number) => Promise<void>
  dispose: () => void
}

// Czeka, aż przeglądarka narysuje zmiany (dwie klatki) - AutoFit mierzy w efektach.
function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

async function imagesLoaded(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map((img) => (img.complete ? img.decode().catch(() => {}) : new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true })
    img.addEventListener('error', resolve, { once: true })
  }))))
}

// Rysuje wszystkie slajdy prezentacji poza oknem, w układzie (nie `display:
// none` ani `visibility: hidden` - patrz „Edytor zostaje zamontowany" w
// docs/architektura.md: eksport kopiuje obliczone style, a ukrycie daje pusty
// plik). Zwraca węzły dopiero, gdy fonty, zdjęcia i AutoFit są gotowe.
export async function renderOffscreen(deck: Deck, aspect: SlideAspect): Promise<OffscreenSlides> {
  const size = SLIDE_SIZE[aspect]
  const host = document.createElement('div')
  host.setAttribute('inert', '')
  host.setAttribute('aria-hidden', 'true')
  Object.assign(host.style, { position: 'fixed', top: '0', left: '-200vw', pointerEvents: 'none', width: `${size.width}px` })
  document.body.append(host)
  const root = createRoot(host)
  const steps = deck.slides.map(() => Infinity)

  const draw = () =>
    root.render(
      <>
        {deck.slides.map((slide, index) => (
          <div key={slide.id} data-slide-index={index} style={{ width: size.width, height: size.height }}>
            <SlideView deck={deck} slide={slide} index={index} total={deck.slides.length} aspect={aspect} step={steps[index]} />
          </div>
        ))}
      </>,
    )

  flushSync(draw)
  await document.fonts.ready
  await imagesLoaded(host)
  await nextPaint()

  const nodes = Array.from(host.querySelectorAll<HTMLElement>('[data-slide-index]')).map((wrapper) => wrapper.firstElementChild as HTMLElement)

  return {
    nodes,
    setStep: async (index, step) => {
      steps[index] = step
      flushSync(draw)
      // Kroki „pokazuj po kolei" mają przejście CSS - eksport chce stanu końcowego.
      host.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el.style.transition) el.style.transition = 'none'
      })
      await nextPaint()
    },
    dispose: () => {
      root.unmount()
      host.remove()
    },
  }
}
