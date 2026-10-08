import type { ReactNode } from 'react'
import { PAGES } from '../utils/route'
import type { Page } from '../utils/route'
import { Badge, Icon } from './ui'
import type { IconName } from './ui'

interface TopBarProps {
  // Strona, na której jest użytkownik - jej odnośnik dostaje `aria-current`.
  page: Page
  // Czy aplikacja ma dane wspólne (Supabase). Bez nich strony Projekty /
  // Grafiki / Historia / Notatki nie istnieją, więc nawigacja znika.
  remote: boolean
  // Liczba otwartych notatek - pigułka przy „Notatki".
  openNotes?: number
  // Trzy miejsca po prawej, w kolejności: pomoc, język plakatu, konto.
  help: ReactNode
  language: ReactNode
  account: ReactNode
}

const PAGE_ICON: Record<Page, IconName> = {
  editor: 'editor',
  projects: 'projects',
  assets: 'graphics',
  history: 'history',
  notes: 'notes',
}

// Odnośnik strony: wygląd przycisku `ghost`; bieżąca strona ma płytkę tła
// i ciemniejszy tekst (kształt, nie sam kolor).
const LINK =
  'inline-flex h-10 flex-none select-none items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[0.875rem] font-semibold text-muted no-underline transition-colors duration-150 hover:bg-fg/[0.07] hover:text-fg aria-[current=page]:bg-fg/[0.09] aria-[current=page]:text-fg min-[900px]:h-9 min-[900px]:px-3'

// Górny pasek wspólny dla wszystkich stron: nazwa aplikacji, nawigacja stron
// (prawdziwe odnośniki z hashem - działa wstecz / dalej i odświeżenie), pomoc,
// język plakatu i konto. Do 900 px nawigacja schodzi do drugiego wiersza
// i przewija się w poziomie.
export function TopBar({ page, remote, openNotes = 0, help, language, account }: TopBarProps) {
  const pages = remote ? PAGES : []
  return (
    <header className="flex flex-none flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-surface px-4 py-2 min-[900px]:h-14 min-[900px]:flex-nowrap min-[900px]:py-0">
      <p className="m-0 flex flex-none items-baseline gap-2 whitespace-nowrap text-[1.0625rem] font-bold leading-none tracking-[-0.01em]">
        SKNM
        <span className="hidden text-[0.8125rem] font-medium tracking-normal text-muted min-[1100px]:inline">Generator plakatów</span>
      </p>

      {pages.length > 0 && (
        <nav
          aria-label="Strony"
          className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-0.5 overflow-x-auto px-4 [scrollbar-width:none] min-[900px]:order-none min-[900px]:mx-0 min-[900px]:w-auto min-[900px]:gap-1 min-[900px]:overflow-visible min-[900px]:px-0"
        >
          {pages.map((item) => (
            <a key={item.page} href={item.hash} className={LINK} aria-current={item.page === page ? 'page' : undefined}>
              <Icon name={PAGE_ICON[item.page]} className="max-[479px]:hidden" />
              {item.label}
              {item.page === 'notes' && openNotes > 0 && <Badge srLabel="do zrobienia">{openNotes}</Badge>}
            </a>
          ))}
        </nav>
      )}

      <div className="ml-auto flex min-w-0 flex-none items-center gap-2 min-[900px]:gap-3">
        {help}
        {language}
        {account}
      </div>
    </header>
  )
}
