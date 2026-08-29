import { useRef } from 'react'
import type { ChangeEvent, PointerEvent } from 'react'

interface ImageUploadProps {
  label: string
  hint?: string
  value: string | null
  onChange: (src: string | null) => void
  enabled?: boolean
  onEnabledChange?: (checked: boolean) => void
  position?: { x: number; y: number }
  onPositionChange?: (partial: { x?: number; y?: number }) => void
  // `false` gdy widget jest już zagnieżdżony w sekcji z własną kreską u góry
  // (np. galeria zdjęć) - wtedy nie dokłada drugiego odstępu i separatora.
  divider?: boolean
}

interface DragState {
  startX: number
  startY: number
  startPosX: number
  startPosY: number
  rect: DOMRect
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

// Ogólne pole do wgrania własnej grafiki (SVG/PNG/JPG) - używane zarówno dla
// logo, jak i dla zdjęć wymaganych przez niektóre szablony.
//
// `enabled`/`onEnabledChange` - jeśli podane, pole dostaje checkbox "włącz",
// który pokazuje/chowa resztę widgetu (element znika wtedy z plakatu).
// `position`/`onPositionChange` - jeśli podane, pod podglądem pojawia się
// kadr, który można przeciągnąć myszką (albo ustawić suwakami), żeby
// przesunąć wycinek zdjęcia w osi X/Y. Ma sens tylko dla zdjęć wypełniających
// kadr (cover) - nie dla logo, które zawsze mieści się w całości.
export function ImageUpload({ label, hint, value, onChange, enabled = true, onEnabledChange, position, onPositionChange, divider = true }: ImageUploadProps) {
  const dragState = useRef<DragState | null>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataUrl = await readAsDataUrl(file)
    onChange(dataUrl)
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!position || !onPositionChange) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x ?? 50,
      startPosY: position.y ?? 50,
      rect: e.currentTarget.getBoundingClientRect(),
    }
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return
    const { startX, startY, startPosX, startPosY, rect } = dragState.current
    const nextX = clamp(startPosX - ((e.clientX - startX) / rect.width) * 100, 0, 100)
    const nextY = clamp(startPosY - ((e.clientY - startY) / rect.height) * 100, 0, 100)
    onPositionChange?.({ x: Math.round(nextX), y: Math.round(nextY) })
  }

  const handlePointerUp = () => {
    dragState.current = null
  }

  return (
    <div className={`flex flex-col gap-2${divider ? ' mt-[18px] border-t border-border pt-[18px]' : ''}`}>
      {onEnabledChange ? (
        <label className="flex w-fit cursor-pointer items-center gap-[9px]">
          <input
            className="h-[17px] w-[17px] cursor-pointer accent-accent"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          <span className="text-[0.9rem] font-medium">{label}</span>
        </label>
      ) : (
        <span className="text-[0.9rem] font-medium">{label}</span>
      )}

      {enabled && (
        <>
          {hint && <p className="m-0 text-[0.8rem] text-muted">{hint}</p>}

          {value && position && (
            <div
              className="relative h-[140px] w-full cursor-grab touch-none select-none overflow-hidden rounded-[10px] border border-field-border bg-cover bg-no-repeat active:cursor-grabbing"
              style={{ backgroundImage: `url(${value})`, backgroundPosition: `${position.x ?? 50}% ${position.y ?? 50}%` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[rgba(15,23,42,0.65)] px-2.5 py-1 text-[0.7rem] text-white">
                przeciągnij, aby ustawić kadr
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {value && !position && (
              <div className="flex h-[52px] w-[52px] flex-none items-center justify-center overflow-hidden rounded-lg border border-field-border bg-white">
                <img className="max-h-full max-w-full object-contain" src={value} alt={`Podgląd: ${label}`} />
              </div>
            )}
            <label className="relative cursor-pointer rounded-lg border border-field-border px-4 py-[9px] text-[0.85rem] transition-[border-color,background-color] hover:border-accent hover:bg-accent-soft">
              {value ? 'Zmień plik' : 'Wybierz plik'}
              <input
                className="absolute inset-0 cursor-pointer opacity-0"
                type="file"
                accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg"
                onChange={handleFile}
              />
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
              <label className="flex items-center gap-3 text-[0.8rem] text-muted">
                <span className="w-[108px] flex-none">Pozycja w poziomie</span>
                <input
                  className="crop-slider flex-1 cursor-pointer"
                  type="range"
                  min="0"
                  max="100"
                  value={position.x ?? 50}
                  onChange={(e) => onPositionChange({ x: Number(e.target.value) })}
                />
              </label>
              <label className="flex items-center gap-3 text-[0.8rem] text-muted">
                <span className="w-[108px] flex-none">Pozycja w pionie</span>
                <input
                  className="crop-slider flex-1 cursor-pointer"
                  type="range"
                  min="0"
                  max="100"
                  value={position.y ?? 50}
                  onChange={(e) => onPositionChange({ y: Number(e.target.value) })}
                />
              </label>
            </div>
          )}
        </>
      )}
    </div>
  )
}
