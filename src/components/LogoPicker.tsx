import type { LibraryAsset } from '../assets/remoteLibrary'
import { IMAGE_THUMB, IMAGE_THUMB_IMG } from './styles'

interface LogoPickerProps {
  logos: LibraryAsset[]
  // Data URL miniatury albo `undefined`, gdy obraz jeszcze się nie wczytał.
  thumbOf: (ref: string) => string | undefined
  // Ile logotypów jeszcze zmieści się na plakacie; 0 wyłącza kafelki.
  remaining: number
  onPick: (ref: string) => void
}

const TILE =
  'flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-field-border bg-transparent p-2 text-center transition-[border-color,background-color] enabled:cursor-pointer enabled:hover:border-accent enabled:hover:bg-accent-soft disabled:opacity-50'

// Siatka logotypów z biblioteki zespołu do wstawienia na plakat.
export function LogoPicker({ logos, thumbOf, remaining, onPick }: LogoPickerProps) {
  if (logos.length === 0) return <p className="m-0 text-[0.8rem] text-muted">Biblioteka jest pusta.</p>
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 min-[480px]:grid-cols-3">
      {logos.map((logo) => {
        const thumb = thumbOf(logo.ref)
        return (
          <li key={logo.ref} className="min-w-0">
            <button type="button" className={`${TILE} w-full`} disabled={remaining <= 0} onClick={() => onPick(logo.ref)}>
              <span className={IMAGE_THUMB} {...(thumb ? {} : { 'data-placeholder': '' })}>
                {thumb && <img className={IMAGE_THUMB_IMG} src={thumb} alt="" />}
              </span>
              <span className="w-full truncate text-[0.8rem] font-medium">{logo.name || 'Bez nazwy'}</span>
              <span className="w-full truncate text-[0.7rem] text-muted">{logo.author_email}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
