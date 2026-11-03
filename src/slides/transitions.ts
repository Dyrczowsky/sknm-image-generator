// Rejestr przejść między slajdami. Przejścia są odtwarzane przez Web Animations
// API na dwóch ułożonych warstwach (slajd wychodzący i wchodzący). Klatki to
// zwykłe obiekty (bez funkcji), bo trafiają też do samodzielnego odtwarzacza HTML
// przez JSON - dozwolone właściwości: opacity, transform, clipPath, filter.

import { MAX_DURATION, MIN_DURATION } from './types'
import type { TransitionKey } from './types'

export interface TransitionSpec {
  label: string
  description: string
}

export const TRANSITIONS: Record<TransitionKey, TransitionSpec> = {
  brak: { label: 'Brak', description: 'Slajd zmienia się natychmiast, bez animacji.' },
  przenikanie: { label: 'Przenikanie', description: 'Nowy slajd płynnie wyłania się nad poprzednim.' },
  wypchniecie: { label: 'Wypchnięcie', description: 'Nowy slajd wypycha poprzedni poza ekran.' },
  wsuniecie: { label: 'Wsunięcie', description: 'Nowy slajd wsuwa się z boku na poprzedni.' },
  odsloniecie: { label: 'Odsłonięcie', description: 'Poprzedni slajd odsuwa się, odsłaniając nowy.' },
  przyblizenie: { label: 'Przybliżenie', description: 'Nowy slajd przybliża się, a poprzedni rozpływa się w tle.' },
  wymazanie: { label: 'Wymazanie', description: 'Nowy slajd odsłania się jak wycierany od boku.' },
  trojkaty: { label: 'Trójkąty', description: 'Nowy slajd rośnie z trójkąta, jak w sygnecie SKNM.' },
  obrot: { label: 'Obrót', description: 'Slajd obraca się wokół osi pionowej jak kartka.' },
  rozmycie: { label: 'Rozmycie', description: 'Poprzedni slajd rozmywa się, a nowy wyostrza.' },
}

export interface TransitionFrames {
  // Incoming slide.
  enter: Keyframe[]
  // Outgoing slide.
  exit: Keyframe[]
  // Czy warstwa wchodząca leży nad wychodzącą.
  enterOnTop: boolean
  easing: string
}

const EASING = 'cubic-bezier(.2,.8,.2,1)'
const NONE = 'polygon(50% 50%, 50% 50%, 50% 50%)'

// direction: 1 = do przodu, -1 = wstecz (przejścia kierunkowe odbijają się).
export function transitionFrames(key: TransitionKey, direction: 1 | -1): TransitionFrames {
  const d = direction
  const x = (pct: number) => `translateX(${pct * d}%)`
  const make = (enter: Keyframe[], exit: Keyframe[], enterOnTop = true, easing = EASING): TransitionFrames => ({
    enter,
    exit,
    enterOnTop,
    easing,
  })

  switch (key) {
    case 'brak':
      return make([], [])
    case 'przenikanie':
      return make([{ opacity: 0 }, { opacity: 1 }], [{ opacity: 1 }, { opacity: 1 }])
    case 'wypchniecie':
      return make(
        [{ transform: x(100) }, { transform: x(0) }],
        [{ transform: x(0) }, { transform: x(-100) }],
      )
    case 'wsuniecie':
      return make([{ transform: x(100) }, { transform: x(0) }], [{ transform: x(0) }, { transform: x(0) }])
    case 'odsloniecie':
      return make([{ transform: x(0) }, { transform: x(0) }], [{ transform: x(0) }, { transform: x(-100) }], false)
    case 'przyblizenie':
      return make(
        [
          { transform: 'scale(.85)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.08)', opacity: 0 },
        ],
      )
    case 'wymazanie':
      return make(
        [
          { clipPath: d === 1 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' },
          { clipPath: 'inset(0 0 0 0)' },
        ],
        [{ opacity: 1 }, { opacity: 1 }],
      )
    case 'trojkaty':
      return make(
        [{ clipPath: NONE }, { clipPath: 'polygon(-150% -100%, 250% -100%, 50% 250%)' }],
        [{ opacity: 1 }, { opacity: 0.6 }],
      )
    case 'obrot':
      return make(
        [
          { transform: `perspective(2000px) rotateY(${90 * d}deg)`, opacity: 0, offset: 0 },
          { transform: `perspective(2000px) rotateY(${90 * d}deg)`, opacity: 0, offset: 0.5 },
          { transform: 'perspective(2000px) rotateY(0deg)', opacity: 1, offset: 1 },
        ],
        [
          { transform: 'perspective(2000px) rotateY(0deg)', opacity: 1, offset: 0 },
          { transform: `perspective(2000px) rotateY(${-90 * d}deg)`, opacity: 0, offset: 0.5 },
          { transform: `perspective(2000px) rotateY(${-90 * d}deg)`, opacity: 0, offset: 1 },
        ],
        true,
        'ease-in-out',
      )
    case 'rozmycie':
      return make(
        [
          { opacity: 0, filter: 'blur(24px)' },
          { opacity: 1, filter: 'blur(0px)' },
        ],
        [
          { opacity: 1, filter: 'blur(0px)' },
          { opacity: 0, filter: 'blur(24px)' },
        ],
      )
  }
}

// prefers-reduced-motion: wszystko poza 'brak' zamienia się w krótkie przenikanie.
export function effectiveTransition(
  key: TransitionKey,
  reducedMotion: boolean,
): { key: TransitionKey; durationScale: number } {
  if (!reducedMotion || key === 'brak') return { key, durationScale: 1 }
  return { key: 'przenikanie', durationScale: 0.25 }
}

export function clampDuration(ms: number): number {
  if (!Number.isFinite(ms)) return MIN_DURATION
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(ms)))
}
