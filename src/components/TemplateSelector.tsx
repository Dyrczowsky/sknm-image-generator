import { posterRegistry } from '../posters/registry'
import { isBannerShape } from '../posters/shape'
import { PosterScaled } from './PosterScaled'
import { SegmentedToggle } from './SegmentedToggle'
import type { Medium, PosterLang, PosterShape, RawPosterData, TemplateRow } from '../types'

const THUMB_SIZE = 180
// Miniatura banera jest szeroka i niska, więc dostaje większą szerokość.
const BANNER_THUMB_SIZE = 280

const MEDIUM_OPTIONS = [
  { value: 'social', label: 'Social media' },
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
// Wybór kolorystyki jest osobno, pod podglądem (SchemeSelector).
const THUMB_DATA: RawPosterData = {}

export function TemplateSelector({ templates, selectedId, onSelect, medium, onMediumChange, bannerShape, lang }: TemplateSelectorProps) {
  const banner = medium === 'banner'
  const thumbShape: PosterShape = banner && isBannerShape(bannerShape) ? bannerShape : banner ? 'cover' : 'square'
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <SegmentedToggle value={medium} onChange={onMediumChange} options={MEDIUM_OPTIONS} ariaLabel="Rodzaj grafiki" />
      </div>
      <div className="flex flex-wrap gap-3.5">
        {templates.map((tpl) => {
          const entry = posterRegistry[tpl.poster_key]
          if (!entry) return null
          const Thumb = banner ? entry.Banner : entry.Component
          const isActive = tpl.id === selectedId
          return (
            <button
              key={tpl.id}
              type="button"
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border-2 bg-transparent p-1.5 text-[0.8rem] text-fg transition-[border-color,transform] hover:-translate-y-0.5 ${
                isActive ? 'border-accent' : 'border-transparent'
              }`}
              onClick={() => onSelect(tpl.id)}
            >
              <div className="overflow-hidden rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
                <PosterScaled size={banner ? BANNER_THUMB_SIZE : THUMB_SIZE} shape={thumbShape}>
                  <Thumb data={THUMB_DATA} scheme={undefined} lang={lang} />
                </PosterScaled>
              </div>
              <span>{entry.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
