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
export function ImageUpload({ label, hint, value, onChange, enabled = true, onEnabledChange, position, onPositionChange }: ImageUploadProps) {
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
    <div className="image-upload">
      {onEnabledChange ? (
        <label className="image-upload-toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} />
          <span className="image-upload-label">{label}</span>
        </label>
      ) : (
        <span className="image-upload-label">{label}</span>
      )}

      {enabled && (
        <>
          {hint && <p className="image-upload-hint">{hint}</p>}

          {value && position && (
            <div
              className="image-upload-crop"
              style={{ backgroundImage: `url(${value})`, backgroundPosition: `${position.x ?? 50}% ${position.y ?? 50}%` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <span className="image-upload-crop-hint">przeciągnij, aby ustawić kadr</span>
            </div>
          )}

          <div className="image-upload-row">
            {value && !position && (
              <div className="image-upload-preview">
                <img src={value} alt={`Podgląd: ${label}`} />
              </div>
            )}
            <label className="image-upload-button">
              {value ? 'Zmień plik' : 'Wybierz plik'}
              <input type="file" accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg" onChange={handleFile} />
            </label>
            {value && (
              <button type="button" className="image-upload-remove" onClick={() => onChange(null)}>
                Usuń
              </button>
            )}
          </div>

          {value && position && onPositionChange && (
            <div className="image-upload-position">
              <label className="image-upload-position-row">
                <span>Pozycja w poziomie</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.x ?? 50}
                  onChange={(e) => onPositionChange({ x: Number(e.target.value) })}
                />
              </label>
              <label className="image-upload-position-row">
                <span>Pozycja w pionie</span>
                <input
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
