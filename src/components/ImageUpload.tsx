import { useId, useRef, useState } from 'react'
import type { ChangeEvent, PointerEvent } from 'react'
import { importImage } from '../assets/assets'
import { importErrorMessage } from '../assets/prepare'
import { IMAGE_ACCEPT } from '../utils/readAsDataUrl'
import { IMAGE_THUMB, IMAGE_THUMB_IMG, UI_ERROR, UI_HINT, UI_LABEL, buttonClass } from './styles'
import { Button, Icon } from './ui'

// Kadr zdjęcia: pozycja wycinka w procentach (0-100) w obu osiach.
interface Position {
  x: number
  y: number
}

interface ImageUploadProps {
  label: string
  hint?: string
  value: string | null
  // `null` = użytkownik usunął plik.
  onChange: (src: string | null) => void
  // Podane razem → pod przyciskami pojawia się kadr do przeciągania i suwaki
  // pozycji. Ma sens tylko dla zdjęć wypełniających kadr (cover).
  position?: Position
  onPositionChange?: (position: Partial<Position>) => void
}

interface DragState {
  startX: number
  startY: number
  startPosition: Position
  rect: DOMRect
}

const clampPercent = (value: number) => Math.round(Math.min(100, Math.max(0, value)))

interface FilePickerButtonProps {
  // Tekst przycisku (np. „Wybierz plik").
  text: string
  accept: string
  multiple?: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

// Przycisk wyboru pliku: `<label>` w wyglądzie przycisku nad prawdziwym
// `<input type="file">`, który jest tylko niewidoczny (nie `display: none`),
// więc dostaje fokus z klawiatury - pierścień rysujemy na etykiecie.
export function FilePickerButton({ text, accept, multiple, onChange }: FilePickerButtonProps) {
  return (
    <label className={`${buttonClass({ variant: 'outline' })} relative has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus`}>
      <Icon name="upload" />
      {text}
      <input className="absolute inset-0 size-full cursor-pointer opacity-0" type="file" accept={accept} multiple={multiple} onChange={onChange} />
    </label>
  )
}

interface PositionSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function PositionSlider({ label, value, onChange }: PositionSliderProps) {
  return (
    <label className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8125rem] text-muted">
      <span className="w-[116px] flex-none">{label}</span>
      <input className="crop-slider min-w-[120px] flex-1 cursor-pointer" type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

// Pole do wgrania własnej grafiki (SVG/PNG/JPG) z podglądem. Dla zdjęć
// (`position`) podglądem jest kadr, który można przeciągnąć myszką albo
// ustawić suwakami, żeby przesunąć wycinek zdjęcia w osi X/Y.
export function ImageUpload({ label, hint, value, onChange, position, onPositionChange }: ImageUploadProps) {
  const drag = useRef<DragState | null>(null)
  // Dlaczego ostatnio wybranego pliku nie udało się przyjąć.
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    try {
      onChange(await importImage(file, 'photo'))
    } catch (caught) {
      setError(importErrorMessage(caught, file.name))
    }
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!position || !onPositionChange) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, startPosition: position, rect: e.currentTarget.getBoundingClientRect() }
  }

  // Przeciągnięcie w prawo przesuwa zdjęcie w prawo, czyli wycinek w lewo.
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const { startX, startY, startPosition, rect } = drag.current
    onPositionChange?.({
      x: clampPercent(startPosition.x - ((e.clientX - startX) / rect.width) * 100),
      y: clampPercent(startPosition.y - ((e.clientY - startY) / rect.height) * 100),
    })
  }

  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2.5 rounded-xl border border-border p-3">
      <span id={labelId} className={UI_LABEL}>
        {label}
      </span>
      {hint && <p className={UI_HINT}>{hint}</p>}

      {value && position && (
        <div
          className="relative h-[140px] w-full cursor-grab touch-none select-none overflow-hidden rounded-lg border border-field-border bg-cover bg-no-repeat active:cursor-grabbing"
          style={{ backgroundImage: `url(${value})`, backgroundPosition: `${position.x}% ${position.y}%` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => {
            drag.current = null
          }}
        >
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[rgba(15,23,42,0.65)] px-2.5 py-1 text-xs text-white">
            przeciągnij, aby ustawić kadr
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {value && !position && (
          <div className={IMAGE_THUMB}>
            <img className={IMAGE_THUMB_IMG} src={value} alt={`Podgląd: ${label}`} />
          </div>
        )}
        <FilePickerButton text={value ? 'Zmień plik' : 'Wybierz plik'} accept={IMAGE_ACCEPT} onChange={handleFile} />
        {value && (
          <Button icon="trash" onClick={() => onChange(null)}>
            Usuń
          </Button>
        )}
      </div>
      {error && (
        <p className={UI_ERROR} role="alert">
          <Icon name="alert" className="mt-px" />
          <span>{error}</span>
        </p>
      )}

      {value && position && onPositionChange && (
        <div className="flex flex-col gap-2.5 rounded-lg bg-accent-soft px-3 py-2.5">
          <PositionSlider label="Pozycja w poziomie" value={position.x} onChange={(x) => onPositionChange({ x })} />
          <PositionSlider label="Pozycja w pionie" value={position.y} onChange={(y) => onPositionChange({ y })} />
        </div>
      )}
    </div>
  )
}
