import type { LibraryAsset } from '../assets/remoteLibrary'
import { AssetThumb } from './AssetThumb'

interface LogoPickerProps {
  logos: LibraryAsset[]
  // Data URL miniatury albo `undefined`, gdy obraz jeszcze się nie wczytał.
  thumbOf: (ref: string) => string | undefined
  // Ile logotypów jeszcze zmieści się na plakacie; 0 wyłącza kafelki.
  remaining: number
  onPick: (ref: string) => void
}

// Kafelek jak na stronie Grafiki (miniatura na białym, nazwa, autor), ale cały
// jest przyciskiem wstawiającym logotyp na plakat.
const TILE =
  'flex w-full min-w-0 flex-col gap-1.5 rounded-lg border border-field-border bg-transparent p-1.5 text-left transition-[border-color,background-color] enabled:cursor-pointer enabled:hover:border-accent enabled:hover:bg-accent-soft disabled:opacity-50'

// Siatka logotypów z biblioteki zespołu do wstawienia na plakat.
export function LogoPicker({ logos, thumbOf, remaining, onPick }: LogoPickerProps) {
  if (logos.length === 0) return <p className="m-0 text-[0.8125rem] text-muted">Biblioteka jest pusta.</p>
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 min-[480px]:grid-cols-3">
      {logos.map((logo) => (
        <li key={logo.ref} className="min-w-0">
          <button type="button" className={TILE} disabled={remaining <= 0} onClick={() => onPick(logo.ref)}>
            <AssetThumb src={thumbOf(logo.ref)} fit="contain" />
            <span className="flex w-full min-w-0 flex-col gap-px px-0.5 pb-0.5">
              <span className="truncate text-[0.8125rem] font-semibold text-fg">{logo.name || 'Bez nazwy'}</span>
              <span className="truncate text-[0.75rem] text-muted">{logo.author_email}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
