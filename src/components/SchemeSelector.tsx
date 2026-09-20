import { ACCENT_DOT, ACCENT_LABELS, ACCENT_NAMES, SCHEME_LABELS, accentsFor, defaultAccentFor, layoutHasAccentAxis, schemesFor } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'
import type { AccentName, PosterLang, RawPosterData, RegistryEntry } from '../types'

const SWATCH_SIZE = 64
const THUMB_DATA: RawPosterData = {}

interface SchemeSelectorProps {
  poster: RegistryEntry | null
  posterKey: string | undefined
  selectedScheme: string | undefined
  onSelectScheme: (name: string) => void
  selectedAccent: AccentName | undefined
  onSelectAccent: (accent: AccentName | undefined) => void
  lang?: PosterLang
}

// Pasek kolorystyki (swatche schematów) + kontrolka koloru akcentu.
// Swatche znikają dla layoutu z jednym schematem (Gala). Kontrolka akcentu
// pokazuje się tylko dla layoutów z osią akcentu (nie „Data"); jest wyszarzona,
// gdy wybrany schemat jest stały (np. „Jasny"/„Szary").
export function SchemeSelector({
  poster, posterKey, selectedScheme, onSelectScheme, selectedAccent, onSelectAccent, lang,
}: SchemeSelectorProps) {
  const SwatchComponent = poster?.Component
  if (!posterKey || !SwatchComponent) return null

  const schemeList = schemesFor(posterKey)
  const showAccent = layoutHasAccentAxis(posterKey)
  const accents = accentsFor(posterKey, selectedScheme)
  const accentEnabled = accents.length > 0
  const defaultAcc = defaultAccentFor(posterKey, selectedScheme)

  return (
    <div className="mt-[18px] flex flex-col gap-3 border-t border-border pt-[18px]">
      {schemeList.length > 1 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-muted">Kolorystyka</span>
          <div className="flex flex-wrap gap-2.5">
            {schemeList.map((name) => (
              <button
                key={name}
                type="button"
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 bg-transparent p-1 text-[0.72rem] transition-[border-color,transform] hover:-translate-y-0.5 ${
                  name === selectedScheme ? 'border-accent text-fg' : 'border-transparent text-muted'
                }`}
                onClick={() => onSelectScheme(name)}
              >
                <div className="overflow-hidden rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
                  <PosterScaled size={SWATCH_SIZE}>
                    <SwatchComponent data={THUMB_DATA} scheme={name} lang={lang} />
                  </PosterScaled>
                </div>
                <span>{SCHEME_LABELS[name] ?? name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showAccent && (
        <div className="flex flex-col gap-2">
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-muted">
            Akcent{!accentEnabled && ' — ten schemat nie ma wariantów akcentu'}
          </span>
          <div className={`flex flex-wrap items-center gap-2 ${accentEnabled ? '' : 'pointer-events-none opacity-40'}`}>
            {(accentEnabled ? accents : ACCENT_NAMES).map((a) => {
              const isSelected = (selectedAccent ?? defaultAcc) === a
              return (
                <button
                  key={a}
                  type="button"
                  disabled={!accentEnabled}
                  title={a === defaultAcc ? `${ACCENT_LABELS[a]} (domyślny)` : ACCENT_LABELS[a]}
                  aria-label={ACCENT_LABELS[a]}
                  aria-pressed={isSelected}
                  className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-accent' : 'border-transparent'
                  }`}
                  onClick={() => onSelectAccent(a === defaultAcc ? undefined : a)}
                >
                  <span className="block h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: ACCENT_DOT[a] }} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
