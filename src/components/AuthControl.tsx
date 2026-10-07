import type { Session } from '../supabase/useSession'

interface AuthControlProps {
  session: Session
  onSignInClick: () => void
}

const BUTTON = 'cursor-pointer rounded-lg border border-field-border px-3 py-1.5 text-[0.8rem] font-semibold text-fg transition-colors hover:border-accent hover:text-accent'

// Stan logowania w nagłówku: przycisk „Zaloguj" albo adres zalogowanej osoby
// i „Wyloguj". Bez konfiguracji Supabase (i w trakcie odczytu sesji) nic nie
// rysuje.
export function AuthControl({ session, onSignInClick }: AuthControlProps) {
  if (session.status === 'unconfigured' || session.status === 'loading') return null
  if (session.status === 'signedOut') {
    return (
      <button type="button" className={BUTTON} onClick={onSignInClick}>
        Zaloguj
      </button>
    )
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="max-w-[200px] truncate text-[0.8rem] text-muted" title={session.email ?? undefined}>
        {session.email}
      </span>
      <button type="button" className={BUTTON} onClick={() => void session.signOut()}>
        Wyloguj
      </button>
    </div>
  )
}
