// Czyste pomocniki eksportowane obok komponentu, żeby testy (bez DOM) mogły je sprawdzić.
/* oxlint-disable react/only-export-components */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { JSX, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from '../ui'
import { SlideScaled } from '../../slides/SlideScaled'
import { SlideView } from '../../slides/SlideView'
import { SLIDE_SIZE } from '../../slides/shape'
import * as present from '../../slides/present'
import type { PresentPos } from '../../slides/present'
import { clampDuration, effectiveTransition, transitionFrames } from '../../slides/transitions'
import type { Deck, SlideAspect } from '../../slides/types'
import { useMediaQuery } from '../../utils/useMediaQuery'

export interface PresentModeProps {
  deck: Deck
  aspect: SlideAspect
  startIndex: number
  // Koniec pokazu (Esc, wyjście z pełnego ekranu, klik „Zakończ"); `lastIndex` - slajd, na którym skończono.
  onExit: (lastIndex: number) => void
}

export type KeyAction = 'next' | 'prev' | 'first' | 'last' | 'exit' | 'black' | 'white' | 'digit'

// Skróty jak w PowerPoint. Enter to „dalej" - chyba że wcześniej wpisano
// numer slajdu (to rozstrzyga komponent, bo zna bufor cyfr).
export function keyAction(key: string): KeyAction | null {
  if (/^[0-9]$/.test(key)) return 'digit'
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
    case 'Enter':
    case 'n':
    case 'N':
      return 'next'
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
    case 'Backspace':
    case 'p':
    case 'P':
      return 'prev'
    case 'Home':
      return 'first'
    case 'End':
      return 'last'
    case 'Escape':
      return 'exit'
    case 'b':
    case 'B':
    case '.':
      return 'black'
    case 'w':
    case 'W':
    case ',':
      return 'white'
    default:
      return null
  }
}

// Szerokość slajdu wpisanego w okno (contain) - reszta to czarne pasy.
export function fitWidth(viewport: { width: number; height: number }, aspect: SlideAspect): number {
  const size = SLIDE_SIZE[aspect]
  const w = Math.min(viewport.width, (viewport.height * size.width) / size.height)
  return Number.isFinite(w) && w > 0 ? Math.floor(w) : 0
}

const SWIPE_MIN = 40

// Przesunięcie palcem w lewo = dalej (jak przewracanie kartki). Ruch głównie
// pionowy to przewijanie/gest systemu, nie zmiana slajdu.
export function swipeAction(dx: number, dy = 0): 'next' | 'prev' | null {
  if (Math.abs(dx) <= SWIPE_MIN || Math.abs(dy) > Math.abs(dx)) return null
  return dx < 0 ? 'next' : 'prev'
}

// Klik w lewe 30% ekranu cofa, gdzie indziej - dalej.
export function clickAction(x: number, width: number): 'next' | 'prev' {
  return x < width * 0.3 ? 'prev' : 'next'
}

export function announce(index: number, total: number): string {
  return `Slajd ${index + 1} z ${total}`
}

const HUD_HIDE_MS = 2000
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

interface RunningTransition {
  gen: number
  from: number
  to: number
  enter: Keyframe[]
  exit: Keyframe[]
  enterOnTop: boolean
  easing: string
  duration: number
}

type Blank = 'black' | 'white' | null

export function PresentMode({ deck, aspect, startIndex, onExit }: PresentModeProps): JSX.Element {
  const steps = useMemo(() => present.stepsForDeck(deck), [deck])
  const total = deck.slides.length
  const reducedMotion = useMediaQuery(REDUCED_MOTION)

  const [pos, setPos] = useState<PresentPos>(() => present.goto(startIndex, steps))
  const [outgoing, setOutgoing] = useState<PresentPos | null>(null)
  const [running, setRunning] = useState<RunningTransition | null>(null)
  const [blank, setBlank] = useState<Blank>(null)
  const [hudVisible, setHudVisible] = useState(true)
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))

  const overlayRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(pos)
  const digitsRef = useRef('')
  const layerEls = useRef(new Map<number, HTMLDivElement>())
  const animations = useRef<Animation[]>([])
  const genRef = useRef(0)
  const exitedRef = useRef(false)
  const touchRef = useRef<{ x: number; y: number } | null>(null)

  // Talia mogła się skrócić w trakcie (np. zapis z innej karty) - pozycja nie może wyjść poza nią.
  const slideIndex = Math.min(pos.slide, Math.max(total - 1, 0))

  // Rodzic może podawać nową funkcję przy każdym renderze - efekty pełnego
  // ekranu nie powinny się przez to restartować.
  const onExitRef = useRef(onExit)
  useLayoutEffect(() => {
    onExitRef.current = onExit
  })
  const exit = useCallback(() => {
    if (exitedRef.current) return
    exitedRef.current = true
    onExitRef.current(posRef.current.slide)
  }, [])

  // Bieżąca animacja kończy się natychmiast, żeby kolejne przejście startowało
  // od czystego stanu - nawigacja nigdy nie czeka na animację.
  const stopAnimations = () => {
    for (const anim of animations.current) {
      anim.finish()
      anim.cancel()
    }
    animations.current = []
  }

  const go = (to: PresentPos) => {
    const from = posRef.current
    if (to.slide === from.slide && to.step === from.step) return
    if (to.slide !== from.slide) {
      stopAnimations()
      const gen = ++genRef.current
      const slide = deck.slides[to.slide]
      const eff = effectiveTransition(slide?.transition ?? deck.transition, reducedMotion)
      const dir = present.direction(from, to) === -1 ? -1 : 1
      const frames = transitionFrames(eff.key, dir)
      if (frames.enter.length === 0 && frames.exit.length === 0) {
        setOutgoing(null)
        setRunning(null)
      } else {
        setOutgoing(from)
        setRunning({
          gen,
          from: from.slide,
          to: to.slide,
          enter: frames.enter,
          exit: frames.exit,
          enterOnTop: frames.enterOnTop,
          easing: frames.easing,
          duration: clampDuration(deck.duration) * eff.durationScale,
        })
      }
    }
    posRef.current = to
    setPos(to)
  }

  const runAction = (action: 'next' | 'prev' | 'first' | 'last') => {
    // Jak w PowerPoint: z wygaszonego ekranu pierwszy krok tylko go zdejmuje.
    if (blank && (action === 'next' || action === 'prev')) {
      setBlank(null)
      return
    }
    setBlank(null)
    const p = posRef.current
    if (action === 'next') go(present.next(p, steps))
    else if (action === 'prev') go(present.prev(p, steps))
    else if (action === 'first') go(present.first())
    else go(present.last(steps))
  }

  // Animacja startuje po wyrenderowaniu obu warstw, przed odmalowaniem.
  useLayoutEffect(() => {
    if (!running) return
    const timing: KeyframeAnimationOptions = { duration: running.duration, easing: running.easing, fill: 'both' }
    const started: Animation[] = []
    const enterEl = layerEls.current.get(running.to)
    const exitEl = layerEls.current.get(running.from)
    if (enterEl && running.enter.length) started.push(enterEl.animate(running.enter, timing))
    if (exitEl && running.exit.length) started.push(exitEl.animate(running.exit, timing))
    animations.current = started
    const { gen } = running
    Promise.all(started.map((a) => a.finished))
      .then(() => {
        if (genRef.current !== gen) return
        for (const anim of started) anim.cancel()
        animations.current = []
        setOutgoing(null)
        setRunning(null)
      })
      // Przerwane przez kolejne przejście - tym zajmuje się `go`.
      .catch(() => {})
  }, [running])

  // Pełny ekran, blokada przewijania, fokus. Ref-y chronią przed podwójnym
  // montowaniem w StrictMode: drugie requestFullscreen bez gestu użytkownika
  // zostałoby odrzucone, więc prosimy raz, a wychodzimy z opóźnieniem.
  const requestedRef = useRef(false)
  const mountedRef = useRef(false)
  const enteredRef = useRef(false)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    mountedRef.current = true
    if (!returnFocusRef.current && document.activeElement instanceof HTMLElement && !el.contains(document.activeElement)) {
      returnFocusRef.current = document.activeElement
    }
    el.focus({ preventScroll: true })

    if (!requestedRef.current) {
      requestedRef.current = true
      // iOS i część przeglądarek nie mają pełnego ekranu dla elementów - zostaje nakładka.
      el.requestFullscreen?.().catch(() => {})
    }

    const onFullscreenChange = () => {
      if (document.fullscreenElement === el) enteredRef.current = true
      else if (enteredRef.current && !document.fullscreenElement) exit()
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      mountedRef.current = false
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.body.style.overflow = prevOverflow
      setTimeout(() => {
        if (mountedRef.current) return
        if (document.fullscreenElement === el) document.exitFullscreen().catch(() => {})
        returnFocusRef.current?.focus({ preventScroll: true })
      }, 0)
    }
  }, [exit])

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Pasek sterowania i kursor znikają po chwili bez ruchu myszy.
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pokeHud = useCallback(() => {
    setHudVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setHudVisible(false), HUD_HIDE_MS)
  }, [])
  // Na starcie pasek jest widoczny (stan początkowy) - tu tylko odliczanie do ukrycia.
  useEffect(() => {
    hideTimer.current = setTimeout(() => setHudVisible(false), HUD_HIDE_MS)
    return () => clearTimeout(hideTimer.current)
  }, [])

  // Najnowszy handler w ref-ie - nasłuch na dokumencie zakładamy raz.
  const onKeyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  const handleKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'Tab') {
      trapTab(e, overlayRef.current)
      return
    }
    // Enter/spacja na przycisku paska to klik w ten przycisk, nie „dalej".
    if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLButtonElement) return
    const action = keyAction(e.key)
    if (!action) return
    e.preventDefault()
    if (action === 'digit') {
      digitsRef.current = (digitsRef.current + e.key).slice(-4)
      return
    }
    const typed = digitsRef.current
    digitsRef.current = ''
    if (action === 'next' && e.key === 'Enter' && typed) {
      setBlank(null)
      go(present.goto(Number(typed) - 1, steps))
      return
    }
    if (action === 'exit') exit()
    else if (action === 'black' || action === 'white') setBlank((b) => (b === action ? null : action))
    else runAction(action)
  }
  useLayoutEffect(() => {
    onKeyRef.current = handleKey
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onKeyRef.current(e)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const onStageClick = (e: ReactMouseEvent) => {
    if (e.button !== 0) return
    runAction(clickAction(e.clientX, window.innerWidth))
  }

  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0]
    touchRef.current = t ? { x: t.clientX, y: t.clientY } : null
  }
  const onTouchEnd = (e: ReactTouchEvent) => {
    const start = touchRef.current
    const t = e.changedTouches[0]
    touchRef.current = null
    if (!start || !t) return
    const action = swipeAction(t.clientX - start.x, t.clientY - start.y)
    if (!action) return
    // Bez tego po przesunięciu przeglądarka może jeszcze dosłać klik.
    e.preventDefault()
    runAction(action)
  }

  // Warstwy: wchodząca (bieżąca), wychodząca (na czas przejścia) i następna
  // wyrenderowana niewidocznie, żeby jej zdjęcia były zdekodowane przed przejściem.
  // Klucz = numer slajdu, więc warstwa podgrzana staje się wchodzącą bez ponownego montażu.
  type LayerRole = 'in' | 'out' | 'preload'
  const layers: { index: number; step: number; role: LayerRole }[] = []
  if (total > 0) {
    layers.push({ index: slideIndex, step: pos.step, role: 'in' })
    if (outgoing && outgoing.slide !== slideIndex && outgoing.slide < total) {
      layers.push({ index: outgoing.slide, step: outgoing.step, role: 'out' })
    }
    const nextIndex = slideIndex + 1
    if (nextIndex < total && !layers.some((l) => l.index === nextIndex)) {
      layers.push({ index: nextIndex, step: 0, role: 'preload' })
    }
    layers.sort((a, b) => a.index - b.index)
  }
  const enterOnTop = running?.enterOnTop ?? true
  const zFor = (role: LayerRole) => (role === 'preload' ? 0 : (role === 'in') === enterOnTop ? 2 : 1)

  const setLayerRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) layerEls.current.set(index, el)
    else layerEls.current.delete(index)
  }

  const size = SLIDE_SIZE[aspect]
  const width = fitWidth(viewport, aspect)
  const fade = 'transition-opacity duration-300 motion-reduce:transition-none'
  const progress = total > 0 ? ((slideIndex + 1) / total) * 100 : 0

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Pokaz slajdów"
      tabIndex={-1}
      className={`fixed inset-0 z-[2147483000] flex items-center justify-center overflow-hidden bg-black outline-none select-none ${hudVisible ? '' : 'cursor-none'}`}
      onMouseMove={pokeHud}
      onClick={onStageClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {total > 0 ? (
        <SlideScaled width={width} aspect={aspect}>
          <div style={{ position: 'relative', width: size.width, height: size.height }}>
            {layers.map((layer) => (
              <div
                key={layer.index}
                ref={setLayerRef(layer.index)}
                aria-hidden={layer.role === 'in' ? undefined : true}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: zFor(layer.role),
                  opacity: layer.role === 'preload' ? 0 : undefined,
                  pointerEvents: layer.role === 'preload' ? 'none' : undefined,
                }}
              >
                <SlideView
                  deck={deck}
                  slide={deck.slides[layer.index]}
                  index={layer.index}
                  total={total}
                  aspect={aspect}
                  step={layer.step}
                />
              </div>
            ))}
          </div>
        </SlideScaled>
      ) : (
        <p className="text-sm text-white/70">Prezentacja nie ma slajdów.</p>
      )}

      {blank && <div aria-hidden="true" className={`absolute inset-0 ${blank === 'black' ? 'bg-black' : 'bg-white'}`} />}

      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1">
        <div className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
      </div>

      <div
        className={`absolute right-4 bottom-4 flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-fg shadow-pop ${fade} focus-within:pointer-events-auto focus-within:opacity-100 ${hudVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <IconButton
          icon="chevronLeft"
          label="Poprzedni"
          disabled={present.isAtStart(pos)}
          onClick={() => runAction('prev')}
        />
        <span className="min-w-14 px-1 text-center text-sm tabular-nums">
          {total > 0 ? `${slideIndex + 1} / ${total}` : '0 / 0'}
        </span>
        <IconButton
          icon="chevronRight"
          label="Następny"
          disabled={present.isAtEnd(pos, steps)}
          onClick={() => runAction('next')}
        />
        <IconButton icon="close" label="Zakończ pokaz" onClick={exit} />
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {total > 0 ? announce(slideIndex, total) : ''}
      </div>
    </div>,
    document.body,
  )
}

// Fokus krąży po przyciskach pokazu - nie ucieka do edytora pod nakładką.
function trapTab(e: KeyboardEvent, root: HTMLElement | null) {
  if (!root) return
  const items = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled])'))
  if (items.length === 0) {
    e.preventDefault()
    root.focus()
    return
  }
  const firstEl = items[0]
  const lastEl = items[items.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === firstEl || active === root)) {
    e.preventDefault()
    lastEl.focus()
  } else if (!e.shiftKey && (active === lastEl || !root.contains(active))) {
    e.preventDefault()
    firstEl.focus()
  }
}
