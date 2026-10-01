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
// Nie tłumaczy interfejsu aplikacji ani treści wpisanych przez użytkownika.
export function LangToggle({ value, onChange }: LangToggleProps) {
  return <SegmentedToggle value={value} onChange={onChange} options={LANG_OPTIONS} ariaLabel="Język plakatu" />
}
