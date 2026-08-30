import { SCHEME_LABELS, schemesFor } from '../posters/schemes'
import { PosterScaled } from './PosterScaled'
import type { RawPosterData, RegistryEntry } from '../types'

const SWATCH_SIZE = 64
const THUMB_DATA: RawPosterData = {}

interface SchemeSelectorProps {
  poster: RegistryEntry | null
  posterKey: string | undefined
  selectedScheme: string | undefined
  onSelectScheme: (name: string) => void
}

// Pasek wyboru kolorystyki wybranego layoutu - renderowany pod podglądem.
// Lista schematów wynika z `schemes.ts` (schemesFor). Nie pokazuje się dla
// layoutów z jednym schematem (np. Gala).
export function SchemeSelector({ poster, posterKey, selectedScheme, onSelectScheme }: SchemeSelectorProps) {
  const schemeList = posterKey ? schemesFor(posterKey) : []
  const SwatchComponent = poster?.Component
  if (schemeList.length <= 1 || !SwatchComponent) return null

  return (
    <div className="mt-[18px] flex flex-col gap-2.5 border-t border-border pt-[18px]">
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
                <SwatchComponent data={THUMB_DATA} scheme={name} />
              </PosterScaled>
            </div>
            <span>{SCHEME_LABELS[name] ?? name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
