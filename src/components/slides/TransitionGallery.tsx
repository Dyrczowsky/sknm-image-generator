import { useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { TRANSITIONS, clampDuration, effectiveTransition, transitionFrames } from '../../slides/transitions'
import { TRANSITION_KEYS } from '../../slides/types'
import type { TransitionKey } from '../../slides/types'
import { CHOICE_TILE } from '../styles'
import { Button } from '../ui'
import { rovingTarget } from '../ui/keys'

export interface TransitionGalleryProps {
  value: TransitionKey
  // Czy wybrane przejście jest nadpisaniem dla slajdu (pokazuje „Przywróć domyślne").
  overridden: boolean
  duration: number
  onChange: (key: TransitionKey) => void
  onDurationChange: (ms: number) => void
  onApplyToAll: () => void
  onResetToDefault: () => void
}

// 600 -> „0,6 s", 1000 -> „1 s". Czysta funkcja, eksportowana do testów.
// oxlint-disable-next-line react/only-export-components
export function formatSeconds(ms: number): string {
  return `${String(ms / 1000).replace('.', ',')} s`
}

interface TileProps {
  tKey: TransitionKey
  checked: boolean
  duration: number
  tabIndex: number
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

function TransitionTile({ tKey, checked, duration, tabIndex, onSelect, onKeyDown }: TileProps) {
  const aRef = useRef<HTMLSpanElement>(null)
  const bRef = useRef<HTMLSpanElement>(null)
  const spec = TRANSITIONS[tKey]

  const reset = () => {
    for (const el of [aRef.current, bRef.current]) {
      if (!el) continue
      for (const animation of el.getAnimations()) animation.cancel()
      el.style.opacity = ''
    }
  }

  // Odtwarza przejście A -> B raz; odtworzenie od nowa zaczyna od początku.
  const play = () => {
    const a = aRef.current
    const b = bRef.current
    if (!a || !b || typeof b.animate !== 'function') return
    reset()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const effective = effectiveTransition(tKey, reduced)
    const frames = transitionFrames(effective.key, 1)
    b.style.opacity = '1'
    a.style.zIndex = frames.enterOnTop ? '0' : '1'
    b.style.zIndex = frames.enterOnTop ? '1' : '0'
    if (effective.key === 'brak') {
      a.style.opacity = '0'
      return
    }
    const options = { duration: clampDuration(duration) * effective.durationScale, easing: frames.easing, fill: 'both' } as const
    a.animate(frames.exit, options)
    b.animate(frames.enter, options)
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabIndex}
      title={spec.description}
      className={`${CHOICE_TILE} shrink-0 aria-checked:border-accent aria-checked:bg-accent-soft aria-checked:font-semibold aria-checked:text-fg`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onPointerEnter={play}
      onPointerLeave={reset}
      onFocus={play}
      onBlur={reset}
    >
      <span aria-hidden="true" className="relative block h-[54px] w-24 overflow-hidden rounded-[5px] bg-fg/[0.06] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]">
        <span ref={aRef} className="absolute inset-0 flex items-center justify-center bg-surface text-[0.75rem] font-bold text-muted">A</span>
        <span ref={bRef} className="absolute inset-0 flex items-center justify-center bg-accent text-[0.75rem] font-bold text-on-accent" style={{ opacity: 0 }}>B</span>
      </span>
      <span className="w-full truncate px-0.5 text-center">{spec.label}</span>
    </button>
  )
}

// Zawartość zakładki „Przejścia": kafelki z podglądem po najechaniu / fokusie,
// czas trwania i akcje zbiorcze.
export function TransitionGallery({ value, overridden, duration, onChange, onDurationChange, onApplyToAll, onResetToDefault }: TransitionGalleryProps) {
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([])
  const sliderId = useId()

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const target = rovingTarget(event.key, index, TRANSITION_KEYS.map(() => true))
    if (target === null) return
    event.preventDefault()
    onChange(TRANSITION_KEYS[target])
    tileRefs.current[target]?.focus()
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div role="radiogroup" aria-label="Przejście" className="flex min-w-0 max-w-full gap-1.5 overflow-x-auto">
        {TRANSITION_KEYS.map((key, index) => (
          <span key={key} ref={(node) => { tileRefs.current[index] = node?.querySelector('button') ?? null }} className="contents">
            <TransitionTile
              tKey={key}
              checked={key === value}
              duration={duration}
              tabIndex={key === value ? 0 : -1}
              onSelect={() => onChange(key)}
              onKeyDown={handleKeyDown(index)}
            />
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[0.8125rem] text-muted">
          <label htmlFor={sliderId}>Czas trwania</label>
          <input
            id={sliderId}
            type="range"
            min={300}
            max={1000}
            step={50}
            value={clampDuration(duration)}
            onChange={(event) => onDurationChange(clampDuration(Number(event.target.value)))}
            className="w-32 accent-accent"
          />
          <span className="w-10 tabular-nums text-fg">{formatSeconds(clampDuration(duration))}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onApplyToAll}>Zastosuj do wszystkich</Button>
          {overridden && <Button variant="ghost" onClick={onResetToDefault}>Przywróć domyślne</Button>}
        </div>
      </div>
    </div>
  )
}
