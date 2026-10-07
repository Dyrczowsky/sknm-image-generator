import { ACCENT_DOT, ACCENT_LABELS, ACCENT_NAMES, SCHEME_LABELS, accentsFor, defaultAccentFor, layoutHasAccentAxis, schemesFor } from '../posters/schemes'
import { SAMPLE_DATA } from '../posters/fallback'
import { PosterScaled } from './PosterScaled'
import { CHOICE_MARK, CHOICE_TILE, UI_HEADING, UI_HINT } from './styles'
import { Icon } from './ui'
import type { AccentName, PosterLang, RegistryEntry } from '../types'

const SWATCH_SIZE = 64

interface SchemeSelectorProps {
  poster: RegistryEntry | undefined
  posterKey: string | undefined
  selectedScheme: string | undefined
  onSelectScheme: (name: string) => void
  selectedAccent: AccentName | undefined
  onSelectAccent: (accent: AccentName | undefined) => void
  lang?: PosterLang
}

// Kolorystyka (swatche schematów) + kolor akcentu - w zakładce „Szablon",
// zaraz pod wybranym szablonem. Swatche znikają dla layoutu z jednym schematem
// (Gala). Kontrolka akcentu pokazuje się tylko dla layoutów z osią akcentu
// (nie „Data"); jest wyszarzona, gdy wybrany schemat jest stały (np. „Jasny" /
// „Szary").
export function SchemeSelector({
  poster, posterKey, selectedScheme, onSelectScheme, selectedAccent, onSelectAccent, lang,
}: SchemeSelectorProps) {
  const SwatchComponent = poster?.Component
  if (!posterKey || !SwatchComponent) return null

  const schemeList = schemesFor(posterKey)
  const showAccent = layoutHasAccentAxis(posterKey)
  const accents = accentsFor(posterKey, selectedScheme)
  const accentEnabled = accents.length > 0
  const defaultAccent = defaultAccentFor(posterKey, selectedScheme)
  if (schemeList.length <= 1 && !showAccent) return null

  return (
    <div className="flex flex-col gap-5">
      {schemeList.length > 1 && (
        <section className="flex flex-col gap-2">
          <h2 className={UI_HEADING}>Kolorystyka</h2>
          <div className="flex flex-wrap gap-1.5">
            {schemeList.map((name) => {
              const isSelected = name === selectedScheme
              return (
                <button key={name} type="button" className={CHOICE_TILE} aria-pressed={isSelected} title={SCHEME_LABELS[name] ?? name} onClick={() => onSelectScheme(name)}>
                  <span aria-hidden="true" className="relative block overflow-hidden rounded-[5px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]">
                    <PosterScaled size={SWATCH_SIZE}>
                      <SwatchComponent data={SAMPLE_DATA} scheme={name} lang={lang} />
                    </PosterScaled>
                    {isSelected && (
                      <span className={CHOICE_MARK}>
                        <Icon name="check" />
                      </span>
                    )}
                  </span>
                  <span className="max-w-16 truncate text-center">{SCHEME_LABELS[name] ?? name}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {showAccent && (
        <section className="flex flex-col gap-2">
          <h2 className={UI_HEADING}>Akcent</h2>
          <div className={`flex flex-wrap items-center gap-1 ${accentEnabled ? '' : 'pointer-events-none opacity-40'}`}>
            {(accentEnabled ? accents : ACCENT_NAMES).map((accent) => {
              const isSelected = (selectedAccent ?? defaultAccent) === accent
              return (
                <button
                  key={accent}
                  type="button"
                  disabled={!accentEnabled}
                  title={accent === defaultAccent ? `${ACCENT_LABELS[accent]} (domyślny)` : ACCENT_LABELS[accent]}
                  aria-label={ACCENT_LABELS[accent]}
                  aria-pressed={isSelected}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-transparent bg-transparent transition-colors duration-150 hover:border-field-border aria-pressed:border-fg min-[900px]:size-9"
                  onClick={() => onSelectAccent(accent === defaultAccent ? undefined : accent)}
                >
                  <span className="block size-5 rounded-full shadow-[0_0_0_1px_rgb(0_0_0/0.18),inset_0_0_0_1px_rgb(255_255_255/0.25)]" style={{ background: ACCENT_DOT[accent] }} />
                </button>
              )
            })}
          </div>
          {!accentEnabled && <p className={UI_HINT}>Ta kolorystyka nie ma wariantów akcentu.</p>}
        </section>
      )}
    </div>
  )
}
