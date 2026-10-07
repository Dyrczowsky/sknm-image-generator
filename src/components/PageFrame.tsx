import { useId } from 'react'
import type { ReactNode } from 'react'

interface PageFrameProps {
  title: string
  // Jedno zdanie pod tytułem: co tu jest i kto to widzi.
  description?: ReactNode
  // Akcje strony po prawej stronie tytułu (np. „Nowy projekt").
  actions?: ReactNode
  children: ReactNode
}

// Rama strony pobocznej (Projekty, Grafiki, Historia, Notatki): tytuł, opis,
// akcje i treść w kolumnie o stałej maksymalnej szerokości.
export function PageFrame({ title, description, actions, children }: PageFrameProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="mx-auto flex w-full max-w-[1040px] flex-col gap-5 px-4 pt-6 pb-12 min-[900px]:px-6 min-[900px]:pt-8">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 id={headingId} className="m-0 text-[1.375rem] font-bold leading-tight">{title}</h1>
          {description && <p className="m-0 max-w-[60ch] text-[0.875rem] leading-snug text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-none flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="min-w-0 text-[0.875rem]">{children}</div>
    </section>
  )
}
