import { SAMPLE_DATA } from '../posters/fallback'
import { posterRegistry } from '../posters/registry'
import { isBannerShape } from '../posters/shape'
import { tileGrid } from '../utils/fit'
import { useElementSize } from '../utils/useElementSize'
import { PosterScaled } from './PosterScaled'
import { SegmentedToggle } from './SegmentedToggle'
import { CHOICE_MARK, CHOICE_TILE, UI_HEADING } from './styles'
import { Icon } from './ui'
import type { Medium, PosterLang, PosterShape, TemplateRow } from '../types'

// Najmniejsza szerokość kafelka (px); baner jest szeroki i niski, więc dostaje więcej.
const MIN_TILE = 92
const MIN_BANNER_TILE = 220
const GAP = 8
// Ramka i odstęp kafelka wokół miniatury (2 × 2 px ramki + 2 × 4 px odstępu).
const TILE_CHROME = 12
// Układ przed pierwszym pomiarem siatki (pierwszy render, testy).
const UNMEASURED = { columns: 3, tile: 112 }

const MEDIUM_OPTIONS = [
  { value: 'social', label: 'Social media i druk' },
  { value: 'banner', label: 'Baner' },
] as const

interface TemplateSelectorProps {
  templates: TemplateRow[]
  selectedId: number | null
  onSelect: (id: number) => void
  medium: Medium
  onMediumChange: (medium: Medium) => void
  // Kształt banera wybranego formatu (okładka strony / wydarzenia) - miniatury
  // zakładki „Baner" rysują się w tej samej proporcji co podgląd.
  bannerShape: PosterShape
  lang?: PosterLang
}

// Miniatury zawsze pokazują dane przykładowe (placeholder) - nie muszą się
// aktualizować na żywo wraz z formularzem, to robi tylko duży podgląd.
// Kształt miniatur: kwadrat dla plakatów; dla banerów kształt wybranego
// formatu, a gdy ten nie jest banerowy - okładka strony.
function bannerThumbShape(medium: Medium, bannerShape: PosterShape): PosterShape {
  if (medium !== 'banner') return 'square'
  return isBannerShape(bannerShape) ? bannerShape : 'cover'
}

// Początek zakładki „Szablon": rodzaj grafiki i siatka szablonów. Siatka
// mierzy swoją szerokość i dzieli ją na równe kolumny, więc kafelki wypełniają
// panel przy każdej jego szerokości (wąski panel boczny, pełna szerokość banera).
export function TemplateSelector({ templates, selectedId, onSelect, medium, onMediumChange, bannerShape, lang }: TemplateSelectorProps) {
  const banner = medium === 'banner'
  const thumbShape = bannerThumbShape(medium, bannerShape)
  const [gridRef, grid] = useElementSize<HTMLDivElement>()
  const measured = tileGrid(grid.width, banner ? MIN_BANNER_TILE : MIN_TILE, GAP)
  const { columns, tile } = measured.columns > 0 ? measured : UNMEASURED

  return (
    <div className="flex flex-col gap-5">
      <SegmentedToggle value={medium} onChange={onMediumChange} options={MEDIUM_OPTIONS} ariaLabel="Rodzaj grafiki" fill className="max-w-[28rem]" />

      <section className="flex flex-col gap-2">
        <h2 className={UI_HEADING}>Szablon</h2>
        <div ref={gridRef} className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: GAP }}>
          {templates.map((tpl) => {
            const entry = posterRegistry[tpl.poster_key]
            if (!entry) return null
            const Thumb = banner ? entry.Banner : entry.Component
            const isActive = tpl.id === selectedId
            return (
              <button key={tpl.id} type="button" className={CHOICE_TILE} aria-pressed={isActive} title={entry.name} onClick={() => onSelect(tpl.id)}>
                {/* Miniatura jest ozdobą: nazwą przycisku ma być sam podpis,
                    a nie cały przykładowy tekst plakatu. */}
                <span aria-hidden="true" className="relative block overflow-hidden rounded-[5px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]">
                  <PosterScaled size={Math.max(tile - TILE_CHROME, 40)} shape={thumbShape}>
                    <Thumb data={SAMPLE_DATA} lang={lang} />
                  </PosterScaled>
                  {isActive && (
                    <span className={CHOICE_MARK}>
                      <Icon name="check" />
                    </span>
                  )}
                </span>
                <span className="w-full truncate px-0.5 text-center">{entry.name}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
