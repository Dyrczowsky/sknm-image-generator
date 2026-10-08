import type { FormProps } from '../types'
import { Button } from '../components/ui'
import { setScaleLinked, setTextScale, setTitleScale } from '../editor/formState'
import { ScaleSlider } from './ScaleSlider'

// Para suwaków rozmiaru - tytuł + pozostały tekst (podtytuł/treść) - z
// przełącznikiem „Przesuwaj razem" pośrodku. Spięte suwaki jeżdżą razem,
// rozpięte niezależnie (logika w `setTitleScale` / `setTextScale` / `setScaleLinked`).
export function TitleTextScaleFields({ value, onChange }: FormProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <ScaleSlider label="Rozmiar tytułu" value={value.titleScale} onChange={(scale) => onChange(setTitleScale(scale))} />
      <Button
        variant="outline"
        icon="link"
        iconEnd={value.scaleLinked ? 'check' : undefined}
        aria-pressed={value.scaleLinked}
        className="self-center"
        onClick={() => onChange(setScaleLinked(!value.scaleLinked))}
      >
        Przesuwaj razem
      </Button>
      <ScaleSlider label="Rozmiar pozostałego tekstu" value={value.textScale} onChange={(scale) => onChange(setTextScale(scale))} />
    </div>
  )
}
