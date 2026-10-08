import type { PosterLang } from '../types'
import { SegmentedToggle } from './SegmentedToggle'

interface LangToggleProps {
  value: PosterLang
  onChange: (lang: PosterLang) => void
}

const LANG_OPTIONS = [
  { value: 'pl', label: 'PL' },
  { value: 'en', label: 'EN' },
] as const

// Przełącznik języka WBUDOWANEGO TEKSTU PLAKATU (domyślne etykiety, nazwa
// organizacji, format daty — patrz src/posters/*.tsx i utils/formatDate.ts).
// Nie tłumaczy interfejsu aplikacji ani treści wpisanych przez użytkownika -
// dlatego obok stoi widoczny podpis „Język plakatu" (w dwóch wierszach, żeby
// mieścił się w górnym pasku także na telefonie). Grupa ma tę samą nazwę dla
// czytników ekranu, więc podpis jest dla nich ukryty.
export function LangToggle({ value, onChange }: LangToggleProps) {
  return (
    <div className="flex flex-none items-center gap-2">
      <span className="w-min text-[0.75rem] font-semibold leading-[1.15] text-muted" aria-hidden="true">
        Język plakatu
      </span>
      <SegmentedToggle value={value} onChange={onChange} options={LANG_OPTIONS} ariaLabel="Język plakatu" />
    </div>
  )
}
