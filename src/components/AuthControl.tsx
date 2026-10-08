import type { Session } from '../supabase/useSession'
import { Button, Popover } from './ui'

interface AuthControlProps {
  session: Session
  onSignInClick: () => void
  // Wylogowanie idzie przez kopię roboczą: otwarty projekt jest najpierw zapisywany.
  onSignOut: () => void
}

// Konto w górnym pasku: przycisk „Zaloguj" albo przycisk z adresem zalogowanej
// osoby, pod którym jest „Wyloguj". Adres widać w pasku dopiero od 1200 px -
// węziej zostaje ikona, a pełny adres jest w wysuwanym panelu. Bez konfiguracji
// Supabase (i w trakcie odczytu sesji) nic nie rysuje.
export function AuthControl({ session, onSignInClick, onSignOut }: AuthControlProps) {
  if (session.status === 'unconfigured' || session.status === 'loading') return null
  if (session.status === 'signedOut') {
    return (
      <Button icon="signIn" onClick={onSignInClick}>
        Zaloguj
      </Button>
    )
  }
  const email = session.email ?? ''
  return (
    <Popover
      label="Konto"
      align="end"
      className="w-64"
      trigger={(props) => (
        <Button {...props} variant="ghost" icon="user" iconEnd="chevronDown" aria-label={`Konto: ${email}`} title={email}>
          <span className="hidden max-w-[180px] truncate min-[1200px]:inline">{email}</span>
        </Button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-2">
          <p className="m-0 px-1 text-[0.8125rem] leading-snug text-muted">
            Zalogowano jako
            <strong className="block break-all font-semibold text-fg">{email}</strong>
          </p>
          <Button
            variant="ghost"
            icon="signOut"
            align="start"
            fullWidth
            onClick={() => {
              close()
              onSignOut()
            }}
          >
            Wyloguj
          </Button>
        </div>
      )}
    </Popover>
  )
}
