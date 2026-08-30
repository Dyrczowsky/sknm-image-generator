import type { ChangeEvent } from 'react'
import type { FormValues } from '../types'
import { MAX_GRAPHICS } from '../posters/theme'
import { readAsDataUrl } from '../utils/readAsDataUrl'

interface GraphicsFieldProps {
  value: FormValues
  onGraphicsAdd: (srcs: string[]) => void
  onGraphicRemove: (index: number) => void
  onGraphicMove: (index: number, dir: -1 | 1) => void
  onShowPkChange: (value: boolean) => void
  onQrUrlChange: (value: string) => void
}

const ACCEPT = '.svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg'

// Stopka plakatu: checkbox "Dodaj logo PK" + hurtowo wgrywane grafiki
// (logotypy patronów, wydziału itd.). Grafiki układają się w rzędzie na
// plakacie tak jak logo PK - kolejność sterowana strzałkami.
export function GraphicsField({ value, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange, onQrUrlChange }: GraphicsFieldProps) {
  const { graphics, showPkLogo, qrUrl } = value
  const full = graphics.length >= MAX_GRAPHICS

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    const srcs = await Promise.all(files.map(readAsDataUrl))
    onGraphicsAdd(srcs)
  }

  const btn =
    'flex-none rounded-lg border border-field-border bg-transparent px-2 py-[6px] text-[0.8rem] text-muted transition-[border-color,color] enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40'

  return (
    <div className="mt-[18px] flex flex-col gap-2.5 border-t border-border pt-[18px]">
      <label className="flex w-fit cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="h-[15px] w-[15px] flex-none cursor-pointer accent-accent"
          checked={showPkLogo}
          onChange={(e) => onShowPkChange(e.target.checked)}
        />
        <span className="text-[0.9rem] font-medium">Dodaj logo Politechniki Krakowskiej</span>
      </label>

      {graphics.length > 0 && (
        <ul className="flex list-none flex-col gap-2 p-0">
          {graphics.map((src, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div className="flex h-[52px] w-[52px] flex-none items-center justify-center overflow-hidden rounded-lg border border-field-border bg-white">
                <img className="max-h-full max-w-full object-contain" src={src} alt={`Grafika ${i + 1}`} />
              </div>
              <span className="min-w-0 flex-1 text-[0.85rem] text-muted">Grafika {i + 1}</span>
              <button type="button" className={btn} disabled={i === 0} onClick={() => onGraphicMove(i, -1)} aria-label="W lewo">
                ↑
              </button>
              <button
                type="button"
                className={btn}
                disabled={i === graphics.length - 1}
                onClick={() => onGraphicMove(i, 1)}
                aria-label="W prawo"
              >
                ↓
              </button>
              <button
                type="button"
                className="flex-none rounded-lg border border-field-border bg-transparent px-3 py-[6px] text-[0.8rem] text-muted transition-[border-color,color] hover:border-danger hover:text-danger"
                onClick={() => onGraphicRemove(i)}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full ? (
        <label className="relative w-fit cursor-pointer rounded-lg border border-field-border px-4 py-[9px] text-[0.85rem] transition-[border-color,background-color] hover:border-accent hover:bg-accent-soft">
          {graphics.length === 0 ? 'Wgraj grafiki' : `Dodaj kolejne (${graphics.length}/${MAX_GRAPHICS})`}
          <input className="absolute inset-0 cursor-pointer opacity-0" type="file" multiple accept={ACCEPT} onChange={handleFiles} />
        </label>
      ) : (
        <p className="m-0 text-[0.8rem] text-muted">Maksymalnie {MAX_GRAPHICS} grafiki.</p>
      )}

      <label className="mt-1 flex flex-col gap-1.5">
        <span className="text-[0.9rem] font-medium">Kod QR (opcjonalnie)</span>
        <input
          type="url"
          inputMode="url"
          placeholder="https://sknm.pk.edu.pl/..."
          value={qrUrl}
          onChange={(e) => onQrUrlChange(e.target.value)}
          className="rounded-lg border border-field-border bg-field px-3 py-[9px] text-[0.9rem] text-fg"
        />
        <span className="text-[0.8rem] text-muted">Podaj link - kod QR wygeneruje się w stopce plakatu.</span>
      </label>
    </div>
  )
}
