import { useId } from 'react'
import type { ReactNode } from 'react'
import { UI_HEADING } from '../components/styles'

interface FormGroupProps {
  // Krótki nagłówek grupy („Teksty", „Zdjęcia", ...).
  title: string
  children: ReactNode
}

// Grupa pól w zakładce edytora: nagłówek + pola. Kolejne grupy oddziela
// kreska (patrz `PANEL_STACK`), więc sama grupa nie ma obramowania.
export function FormGroup({ title, children }: FormGroupProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className={UI_HEADING}>
        {title}
      </h2>
      {children}
    </section>
  )
}

// Kontener grup w panelu: odstęp i kreska między sąsiednimi grupami. Panel nie
// ma własnego odstępu zewnętrznego - daje go zakładka w powłoce edytora.
export const PANEL_STACK = 'flex flex-col gap-5 [&>section+section]:border-t [&>section+section]:border-border [&>section+section]:pt-5'
