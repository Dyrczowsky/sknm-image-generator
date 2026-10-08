import type { ReactNode } from 'react'
import { Badge } from './ui'

// Wspólne komponenty stron z kartami (klasy w `cardStyles.ts`).

interface CardSectionProps {
  title: string
  // Liczba pozycji obok tytułu; pomijana, gdy sekcja nie ma licznika.
  count?: number
  children: ReactNode
}

// Sekcja strony: nagłówek z licznikiem i treść pod nim.
export function CardSection({ title, count, children }: CardSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 flex items-center gap-2 text-[0.9375rem] font-bold leading-tight text-fg">
        {title}
        {count !== undefined && <Badge>{count}</Badge>}
      </h2>
      {children}
    </section>
  )
}

// Komunikat „nic tu nie ma" w ramce sekcji.
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="m-0 rounded-xl border border-dashed border-border px-4 py-6 text-center text-muted">{children}</p>
}
