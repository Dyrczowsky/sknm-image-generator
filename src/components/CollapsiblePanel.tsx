import type { ReactNode } from 'react'

interface CollapsiblePanelProps {
  id: string
  title: string
  // Krótki opis zawartości pokazywany przy nagłówku, gdy panel jest zwinięty
  // (np. nazwa wybranego szablonu).
  summary?: string
  open: boolean
  onToggle: () => void
  className?: string
  children: ReactNode
}

// Karta sekcji kreatora ze zwijaną treścią. Zwinięta treść dostaje `hidden`
// zamiast być odmontowana - pola formularza i miniatury zachowują stan.
export function CollapsiblePanel({ id, title, summary, open, onToggle, className, children }: CollapsiblePanelProps) {
  const bodyId = `panel-${id}`
  return (
    <section className={className}>
      <h2 className={open ? 'mb-3.5' : undefined}>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-base font-semibold uppercase tracking-[0.04em] text-muted hover:text-fg"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
        >
          <span>
            {title}
            {!open && summary && <span className="ml-2 font-medium normal-case tracking-normal text-fg">· {summary}</span>}
          </span>
          <span aria-hidden="true" className={`flex-none transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>
      </h2>
      <div id={bodyId} hidden={!open}>
        {children}
      </div>
    </section>
  )
}
