import { ScaleSlider } from './ScaleSlider'

interface TitleTextScaleFieldsProps {
  titleScale: number
  textScale: number
  linked: boolean
  onTitleScaleChange: (value: number) => void
  onTextScaleChange: (value: number) => void
  onLinkedChange: (value: boolean) => void
}

// Para suwaków rozmiaru - tytuł + pozostały tekst (podtytuł/treść) - ze
// spinaczem pośrodku. Spięte: przesunięcie jednego suwaka ustawia OBA na
// ten sam procent (zapięcie spinacza synchronizuje też od razu, żeby nie
// zostawić suwaków w rozjeździe). Rozpięte: suwaki jeżdżą niezależnie.
export function TitleTextScaleFields({ titleScale, textScale, linked, onTitleScaleChange, onTextScaleChange, onLinkedChange }: TitleTextScaleFieldsProps) {
  const handleTitleChange = (value: number) => {
    onTitleScaleChange(value)
    if (linked) onTextScaleChange(value)
  }

  const handleTextChange = (value: number) => {
    onTextScaleChange(value)
    if (linked) onTitleScaleChange(value)
  }

  const handleLinkedChange = (next: boolean) => {
    onLinkedChange(next)
    if (next) onTextScaleChange(titleScale)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ScaleSlider label="Rozmiar tytułu" value={titleScale} onChange={handleTitleChange} />
      <label className="flex w-fit cursor-pointer items-center gap-2 self-center text-[0.8rem] text-muted">
        <input
          type="checkbox"
          className="h-[15px] w-[15px] flex-none cursor-pointer accent-accent"
          checked={linked}
          onChange={(e) => handleLinkedChange(e.target.checked)}
        />
        <span>🔗 Połącz suwaki (przesuwają się razem)</span>
      </label>
      <ScaleSlider label="Rozmiar pozostałego tekstu" value={textScale} onChange={handleTextChange} />
    </div>
  )
}
