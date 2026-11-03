import { memo } from 'react'
import { SLIDE_GROUPS } from '../../slides/defineSlide'
import type { SlideDefinition } from '../../slides/defineSlide'
import { SLIDE_LAYOUTS } from '../../slides/komponenty'
import { SlideScaled } from '../../slides/SlideScaled'
import { SlideView } from '../../slides/SlideView'
import type { SlideAspect, SlideThemeKey } from '../../slides/types'
import { CHOICE_TILE, UI_HEADING } from '../styles'

export interface LayoutGalleryProps {
  theme: SlideThemeKey
  aspect: SlideAspect
  onPick: (layoutKey: string) => void
}

const PREVIEW_WIDTH = 160

interface PreviewProps {
  layout: SlideDefinition
  theme: SlideThemeKey
  aspect: SlideAspect
}

// Żywa miniatura układu z jego danymi domyślnymi. Memo, bo galeria otwiera się
// w wysuwanym panelu często, a render slajdów jest drogi.
const LayoutPreview = memo(function LayoutPreview({ layout, theme, aspect }: PreviewProps) {
  return (
    <SlideScaled width={PREVIEW_WIDTH} aspect={aspect}>
      <SlideView
        deck={{ theme }}
        slide={{ id: layout.key, layout: layout.key, data: layout.defaults, background: layout.background ?? 'jasne', mirrored: false, reveal: false }}
        index={0}
        total={1}
        aspect={aspect}
      />
    </SlideScaled>
  )
})

// Galeria „Nowy slajd": układy pogrupowane według SLIDE_GROUPS. Kafelki to
// zwykłe przyciski w kolejności tabulacji.
export function LayoutGallery({ theme, aspect, onPick }: LayoutGalleryProps) {
  const columns = aspect === '1:1' ? 'grid-cols-4' : 'grid-cols-3'
  return (
    <div className="flex flex-col gap-4">
      {SLIDE_GROUPS.map(({ group, label }) => {
        const layouts = SLIDE_LAYOUTS.filter((layout) => layout.group === group)
        if (layouts.length === 0) return null
        return (
          <section key={group} className="flex flex-col gap-2">
            <h3 className={UI_HEADING}>{label}</h3>
            <div className={`grid ${columns} gap-2`}>
              {layouts.map((layout) => (
                <button key={layout.key} type="button" className={CHOICE_TILE} title={layout.description} onClick={() => onPick(layout.key)}>
                  <span aria-hidden="true" className="block overflow-hidden rounded-[5px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]">
                    <LayoutPreview layout={layout} theme={theme} aspect={aspect} />
                  </span>
                  <span className="w-full truncate px-0.5 text-center">{layout.label}</span>
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
