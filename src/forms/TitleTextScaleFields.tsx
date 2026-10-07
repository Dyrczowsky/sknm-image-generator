import type { FormProps } from '../types'
import { CHECKBOX } from '../components/styles'
import { setScaleLinked, setTextScale, setTitleScale } from '../editor/formState'
import { ScaleSlider } from './ScaleSlider'

// Para suwaków rozmiaru - tytuł + pozostały tekst (podtytuł/treść) - ze
// spinaczem pośrodku. Spięte suwaki jeżdżą razem, rozpięte niezależnie
// (logika w `setTitleScale` / `setTextScale` / `setScaleLinked`).
export function TitleTextScaleFields({ value, onChange }: FormProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <ScaleSlider label="Rozmiar tytułu" value={value.titleScale} onChange={(scale) => onChange(setTitleScale(scale))} />
      <label className="flex w-fit cursor-pointer items-center gap-2 self-center text-[0.8rem] text-muted">
        <input
          type="checkbox"
          className={CHECKBOX}
          checked={value.scaleLinked}
          onChange={(e) => onChange(setScaleLinked(e.target.checked))}
        />
        <span>🔗 Połącz suwaki (przesuwają się razem)</span>
      </label>
      <ScaleSlider label="Rozmiar pozostałego tekstu" value={value.textScale} onChange={(scale) => onChange(setTextScale(scale))} />
    </div>
  )
}
