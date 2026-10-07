import { useId, type KeyboardEvent } from 'react'
import { SHORTCUTS, formatCombo, type ShortcutId } from '../shortcuts/shortcuts'

interface Props {
  enabled: readonly ShortcutId[]
  isMac: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Przycisk w nagłówku + okienko z listą skrótów. Okienko jest zawsze w DOM
// (czytniki ekranu, aria-controls), a widoczność daje: `open` (klik),
// najechanie myszą albo fokus klawiatury (focus-visible, więc kliknięcie
// myszą nie „przykleja" okienka). Escape zamyka.
export function ShortcutsHelp({ enabled, isMac, open, onOpenChange }: Props) {
  const popupId = useId()
  const items = SHORTCUTS.filter((s) => enabled.includes(s.id))

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation()
      onOpenChange(false)
    }
  }

  return (
    <div className="group relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label="Skróty klawiszowe"
        aria-expanded={open}
        aria-controls={popupId}
        onClick={() => onOpenChange(!open)}
        className="cursor-pointer rounded-lg border border-field-border p-2 text-muted transition-[border-color,color] hover:border-accent hover:text-fg"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
        </svg>
      </button>
      <div
        id={popupId}
        role="region"
        aria-label="Lista skrótów klawiszowych"
        className={`absolute right-0 top-full z-20 mt-2 w-max max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-3 text-[0.85rem] text-fg shadow-lg group-hover:block group-has-[:focus-visible]:block ${open ? 'block' : 'hidden'}`}
      >
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4">
              <span>{s.label}</span>
              <kbd className="rounded-md border border-field-border bg-field px-1.5 py-0.5 font-sans text-[0.8rem] text-muted">
                {formatCombo(s.combo, isMac)}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
