import type { PosterLang } from '../types'

interface LangToggleProps {
  value: PosterLang
  onChange: (lang: PosterLang) => void
}

// Przełącznik języka WBUDOWANEGO TEKSTU PLAKATU (domyślne etykiety, nazwa
// organizacji, format daty — patrz src/posters/*.tsx i utils/formatDate.ts).
// Nie tłumaczy interfejsu aplikacji ani treści wpisanych przez użytkownika.
export function LangToggle({ value, onChange }: LangToggleProps) {
  const base = 'cursor-pointer rounded-md px-3 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] transition-colors'
  const active = 'bg-accent text-white'
  const inactive = 'text-muted hover:text-fg'

  return (
    <div className="inline-flex gap-1 rounded-lg border border-field-border bg-field p-1" role="group" aria-label="Język plakatu">
      <button
        type="button"
        className={`${base} ${value === 'pl' ? active : inactive}`}
        aria-pressed={value === 'pl'}
        onClick={() => onChange('pl')}
      >
        PL
      </button>
      <button
        type="button"
        className={`${base} ${value === 'en' ? active : inactive}`}
        aria-pressed={value === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
    </div>
  )
}
