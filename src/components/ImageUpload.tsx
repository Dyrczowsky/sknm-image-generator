import { useRef } from 'react'
import type { ChangeEvent, PointerEvent } from 'react'
import { importImage } from '../assets/assets'
import { IMAGE_ACCEPT } from '../utils/readAsDataUrl'
import { FILE_PICKER, FILE_PICKER_INPUT, IMAGE_THUMB, IMAGE_THUMB_IMG } from './styles'

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

interface PositionSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function PositionSlider({ label, value, onChange }: PositionSliderProps) {
  return (
    <label className="flex items-center gap-3 text-[0.8rem] text-muted">
      <span className="w-[108px] flex-none">{label}</span>
      <input className="crop-slider flex-1 cursor-pointer" type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

// Pole do wgrania własnej grafiki (SVG/PNG/JPG) z podglądem. Dla zdjęć
// (`position`) podglądem jest kadr, który można przeciągnąć myszką albo
// ustawić suwakami, żeby przesunąć wycinek zdjęcia w osi X/Y.
export function ImageUpload({ label, hint, value, onChange, position, onPositionChange }: ImageUploadProps) {
  const drag = useRef<DragState | null>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) onChange(await importImage(file, 'photo'))
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

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.9rem] font-medium">{label}</span>
      {hint && <p className="m-0 text-[0.8rem] text-muted">{hint}</p>}

      {value && position && (
        <div
          className="relative h-[140px] w-full cursor-grab touch-none select-none overflow-hidden rounded-[10px] border border-field-border bg-cover bg-no-repeat active:cursor-grabbing"
          style={{ backgroundImage: `url(${value})`, backgroundPosition: `${position.x}% ${position.y}%` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => {
            drag.current = null
          }}
        >
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[rgba(15,23,42,0.65)] px-2.5 py-1 text-[0.7rem] text-white">
            przeciągnij, aby ustawić kadr
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {value && !position && (
          <div className={IMAGE_THUMB}>
            <img className={IMAGE_THUMB_IMG} src={value} alt={`Podgląd: ${label}`} />
          </div>
        )}
        <label className={`relative ${FILE_PICKER}`}>
          {value ? 'Zmień plik' : 'Wybierz plik'}
          <input className={FILE_PICKER_INPUT} type="file" accept={IMAGE_ACCEPT} onChange={handleFile} />
        </label>
        {value && (
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-field-border bg-transparent px-4 py-[9px] text-[0.85rem] text-muted transition-[border-color,color] hover:border-danger hover:text-danger"
            onClick={() => onChange(null)}
          >
            Usuń
          </button>
        )}
      </div>

      {value && position && onPositionChange && (
        <div className="mt-1 flex flex-col gap-2.5 rounded-[10px] bg-accent-soft px-3.5 py-3">
          <PositionSlider label="Pozycja w poziomie" value={position.x} onChange={(x) => onPositionChange({ x })} />
          <PositionSlider label="Pozycja w pionie" value={position.y} onChange={(y) => onPositionChange({ y })} />
        </div>
      )}
    </div>
  )
}
