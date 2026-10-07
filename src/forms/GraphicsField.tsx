import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { FormProps } from '../types'
import { useAssetLibraryContext } from '../assets/AssetLibraryContext'
import { importImage } from '../assets/assets'
import { importErrorMessage } from '../assets/prepare'
import { srcOf } from '../assets/registry'
import { LogoPicker } from '../components/LogoPicker'
import { CHECKBOX, COMPACT_INPUT, FILE_PICKER, FILE_PICKER_INPUT, FORM_SECTION, IMAGE_THUMB, IMAGE_THUMB_IMG } from '../components/styles'
import { addGraphics, moveGraphic, removeGraphic, setQrUrl, setShowPkLogo } from '../editor/formState'
import { MAX_GRAPHICS } from '../posters/theme'
import { IMAGE_ACCEPT } from '../utils/readAsDataUrl'

const ROW_BUTTON = 'flex-none rounded-lg border border-field-border bg-transparent py-[6px] text-[0.8rem] text-muted transition-[border-color,color]'
const MOVE_BUTTON = `${ROW_BUTTON} px-2 enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40`
const REMOVE_BUTTON = `${ROW_BUTTON} px-3 hover:border-danger hover:text-danger`

// Stopka plakatu: checkbox "Dodaj logo PK" + hurtowo wgrywane grafiki
// (logotypy patronów, wydziału itd.) + link do kodu QR. Grafiki układają się
// w rzędzie na plakacie tak jak logo PK - kolejność sterowana strzałkami.
export function GraphicsField({ value, onChange }: FormProps) {
  const { graphics, showPkLogo, qrUrl } = value
  const full = graphics.length >= MAX_GRAPHICS
  const library = useAssetLibraryContext()
  const [pickerOpen, setPickerOpen] = useState(false)
  // Wymusza ponowne narysowanie po wczytaniu miniatur do rejestru.
  const [, setHydrated] = useState(0)
  // Pliki z ostatniego wgrywania, których nie udało się przyjąć.
  const [errors, setErrors] = useState<string[]>([])
  const logos = library?.items.filter((asset) => asset.kind === 'logo') ?? []

  const logoRefs = logos.map((asset) => asset.ref).join(',')
  const loadThumbs = library?.loadThumbs

  // Miniatury dociągamy po otwarciu i ponownie, gdy lista biblioteki się zmieni
  // (np. wczytała się dopiero po otwarciu).
  useEffect(() => {
    if (!pickerOpen || !loadThumbs || !logoRefs) return
    let active = true
    void loadThumbs(logoRefs.split(',')).then(() => active && setHydrated((n) => n + 1))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `loadThumbs` zmienia się co render
  }, [pickerOpen, logoRefs])

  const togglePicker = () => setPickerOpen((open) => !open)

  const pickLogo = (ref: string) => {
    const src = srcOf(ref)
    if (!src) return
    onChange((form) => (form.graphics.includes(src) ? form : addGraphics([src])(form)))
  }

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    setErrors([])
    // Jeden zły plik nie może zabrać pozostałych.
    const results = await Promise.allSettled(files.map((file) => importImage(file, 'logo')))
    const added = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
    if (added.length > 0) onChange(addGraphics(added))
    setErrors(results.flatMap((result, i) => (result.status === 'rejected' ? [importErrorMessage(result.reason, files[i].name)] : [])))
  }

  return (
    <div className={FORM_SECTION}>
      <label className="flex w-fit cursor-pointer items-center gap-2">
        <input type="checkbox" className={CHECKBOX} checked={showPkLogo} onChange={(e) => onChange(setShowPkLogo(e.target.checked))} />
        <span className="text-[0.9rem] font-medium">Dodaj logo Politechniki Krakowskiej</span>
      </label>

      {graphics.length > 0 && (
        <ul className="flex list-none flex-col gap-2 p-0">
          {graphics.map((src, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div className={IMAGE_THUMB}>
                <img className={IMAGE_THUMB_IMG} src={src} alt={`Grafika ${i + 1}`} />
              </div>
              <span className="min-w-0 flex-1 text-[0.85rem] text-muted">Grafika {i + 1}</span>
              <button type="button" className={MOVE_BUTTON} disabled={i === 0} onClick={() => onChange(moveGraphic(i, -1))} aria-label="W lewo">
                ↑
              </button>
              <button type="button" className={MOVE_BUTTON} disabled={i === graphics.length - 1} onClick={() => onChange(moveGraphic(i, 1))} aria-label="W prawo">
                ↓
              </button>
              <button type="button" className={REMOVE_BUTTON} onClick={() => onChange(removeGraphic(i))}>
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {full ? (
          <p className="m-0 text-[0.8rem] text-muted">Maksymalnie {MAX_GRAPHICS} grafiki.</p>
        ) : (
          <label className={`relative w-fit ${FILE_PICKER}`}>
            {graphics.length === 0 ? 'Wgraj grafiki' : `Dodaj kolejne (${graphics.length}/${MAX_GRAPHICS})`}
            <input className={FILE_PICKER_INPUT} type="file" multiple accept={IMAGE_ACCEPT} onChange={handleFiles} />
          </label>
        )}
        {library && (
          <button type="button" className={FILE_PICKER} aria-expanded={pickerOpen} onClick={togglePicker}>
            Z biblioteki
          </button>
        )}
      </div>
      {errors.length > 0 && (
        <div className="flex flex-col gap-1 text-[0.8rem] text-danger" role="alert">
          {errors.map((message, i) => (
            <p key={i} className="m-0">
              {message}
            </p>
          ))}
        </div>
      )}
      {library && pickerOpen && (
        <LogoPicker logos={logos} thumbOf={srcOf} remaining={MAX_GRAPHICS - graphics.length} onPick={pickLogo} />
      )}

      <label className="mt-1 flex flex-col gap-1.5">
        <span className="text-[0.9rem] font-medium">Kod QR (opcjonalnie)</span>
        <input
          type="url"
          inputMode="url"
          placeholder="https://sknm.pk.edu.pl/..."
          value={qrUrl}
          onChange={(e) => onChange(setQrUrl(e.target.value))}
          className={COMPACT_INPUT}
        />
        <span className="text-[0.8rem] text-muted">Podaj link - kod QR wygeneruje się w stopce plakatu (tło przezroczyste, kolor ze schematu).</span>
      </label>
    </div>
  )
}
