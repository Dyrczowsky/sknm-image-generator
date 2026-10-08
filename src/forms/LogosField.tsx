import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { FormProps } from '../types'
import { useAssetLibraryContext } from '../assets/AssetLibraryContext'
import { importImage } from '../assets/assets'
import { importErrorMessage } from '../assets/prepare'
import { srcOf } from '../assets/registry'
import { FilePickerButton } from '../components/ImageUpload'
import { LogoPicker } from '../components/LogoPicker'
import { IMAGE_THUMB, IMAGE_THUMB_IMG, UI_ERROR, UI_HINT, UI_LABEL } from '../components/styles'
import { Button, Icon, IconButton } from '../components/ui'
import { addGraphics, moveGraphic, removeGraphic, setShowPkLogo } from '../editor/formState'
import { MAX_GRAPHICS } from '../posters/theme'
import { IMAGE_ACCEPT } from '../utils/readAsDataUrl'

// Logotypy w stopce plakatu: przełącznik logo PK + wgrywane grafiki (patroni,
// wydziału itd.) z biblioteki lub z pliku. Na plakacie stoją w jednym rzędzie
// od lewej: najpierw logo PK (jeśli włączone), potem grafiki w kolejności
// z listy - strzałki przesuwają grafikę o jedno miejsce w lewo / w prawo.
export function LogosField({ value, onChange }: FormProps) {
  const { graphics, showPkLogo } = value
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className={UI_LABEL}>Logo Politechniki Krakowskiej</span>
        <IconButton
          icon={showPkLogo ? 'eye' : 'eyeOff'}
          label={`${showPkLogo ? 'Ukryj' : 'Pokaż'} na plakacie: logo Politechniki Krakowskiej`}
          aria-pressed={showPkLogo}
          className="-my-2"
          onClick={() => onChange(setShowPkLogo(!showPkLogo))}
        />
      </div>

      {graphics.length > 0 && (
        <>
          <p className={UI_HINT}>Kolejność w stopce plakatu, od lewej{showPkLogo ? ' (po logo PK)' : ''}.</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {graphics.map((src, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <div className={IMAGE_THUMB}>
                  <img className={IMAGE_THUMB_IMG} src={src} alt="" />
                </div>
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-muted">Grafika {i + 1}</span>
                <IconButton
                  icon="arrowLeft"
                  label={`Przesuń grafikę ${i + 1} w lewo na plakacie`}
                  disabled={i === 0}
                  onClick={() => onChange(moveGraphic(i, -1))}
                />
                <IconButton
                  icon="arrowRight"
                  label={`Przesuń grafikę ${i + 1} w prawo na plakacie`}
                  disabled={i === graphics.length - 1}
                  onClick={() => onChange(moveGraphic(i, 1))}
                />
                <IconButton icon="trash" label={`Usuń grafikę ${i + 1} z plakatu`} onClick={() => onChange(removeGraphic(i))} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {full ? (
          <p className={UI_HINT}>Maksymalnie {MAX_GRAPHICS} grafiki.</p>
        ) : (
          <FilePickerButton
            text={graphics.length === 0 ? 'Wgraj grafiki' : `Dodaj kolejne (${graphics.length}/${MAX_GRAPHICS})`}
            accept={IMAGE_ACCEPT}
            multiple
            onChange={handleFiles}
          />
        )}
        {library && (
          <Button icon="library" aria-expanded={pickerOpen} onClick={() => setPickerOpen((open) => !open)}>
            Z biblioteki
          </Button>
        )}
      </div>
      {errors.length > 0 && (
        <div className="flex flex-col gap-1" role="alert">
          {errors.map((message, i) => (
            <p key={i} className={UI_ERROR}>
              <Icon name="alert" className="mt-px" />
              <span>{message}</span>
            </p>
          ))}
        </div>
      )}
      {library && pickerOpen && <LogoPicker logos={logos} thumbOf={srcOf} remaining={MAX_GRAPHICS - graphics.length} onPick={pickLogo} />}
    </div>
  )
}
