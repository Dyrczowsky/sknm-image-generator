import type { ReactNode } from 'react'
import type { RemoteListStatus } from '../supabase/useRemoteList'
import type { SessionStatus } from '../supabase/useSession'
import { Button, Icon } from './ui'
import type { IconName } from './ui'

interface RemotePanelProps {
  sessionStatus: SessionStatus
  listStatus: RemoteListStatus
  // Co odblokowuje logowanie, w bierniku: „Zaloguj się, aby zobaczyć <subject>."
  subject: string
  onSignInClick: () => void
  onRetry: () => void
  // Komunikat o nieudanej zmianie (usunięcie, zapis) - nad treścią.
  actionError?: string | null
  children: ReactNode
}

interface NoticeProps {
  icon: IconName
  title: string
  // Wiersz pod tytułem; akcja (przycisk) idzie jako dziecko.
  text?: string
  alert?: boolean
  children?: ReactNode
}

// Wyśrodkowana karta stanu (zaproszenie do logowania, błąd): ikona, tytuł, opis, akcja.
function Notice({ icon, title, text, alert = false, children }: NoticeProps) {
  return (
    <div
      role={alert ? 'alert' : undefined}
      className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-10 text-center"
    >
      <span className={`flex size-12 items-center justify-center rounded-full ${alert ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-text'}`}>
        <Icon name={icon} size="lg" />
      </span>
      <h2 className="m-0 text-[1rem] font-bold leading-tight text-fg">{title}</h2>
      {text && <p className="m-0 text-muted">{text}</p>}
      {children}
    </div>
  )
}

// Treść panelu z danymi wspólnymi (historia, notatki): zależnie od stanu
// pokazuje zaproszenie do logowania, ładowanie, błąd z ponowieniem albo dzieci.
export function RemotePanel({ sessionStatus, listStatus, subject, onSignInClick, onRetry, actionError, children }: RemotePanelProps) {
  if (sessionStatus === 'signedOut') {
    return (
      <Notice icon="user" title="Tylko dla członków koła" text={`Zaloguj się, aby zobaczyć ${subject}.`}>
        <Button variant="primary" size="md" icon="signIn" onClick={onSignInClick}>Zaloguj się</Button>
      </Notice>
    )
  }
  if (sessionStatus === 'unconfigured') {
    return <Notice icon="offline" title="Brak połączenia z kontem zespołu" text="Ta wersja aplikacji została zbudowana bez logowania, więc wspólne dane są niedostępne." />
  }
  if (listStatus === 'error') {
    return (
      <Notice alert icon="alert" title="Nie udało się wczytać danych" text="Sprawdź połączenie z internetem i spróbuj jeszcze raz.">
        <Button variant="outline" size="md" icon="retry" onClick={onRetry}>Spróbuj ponownie</Button>
      </Notice>
    )
  }
  if (listStatus !== 'ready') {
    return (
      <p className="m-0 flex items-center justify-center gap-2 py-10 text-muted" role="status">
        <Icon name="spinner" className="animate-spin" />
        Ładowanie…
      </p>
    )
  }
  return (
    <>
      {actionError && (
        <p className="m-0 mb-4 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-[0.8125rem] text-danger" role="alert">
          <Icon name="alert" className="mt-px" />
          {actionError}
        </p>
      )}
      {children}
    </>
  )
}
