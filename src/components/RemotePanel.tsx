import type { ReactNode } from 'react'
import type { RemoteListStatus } from '../supabase/useRemoteList'
import type { SessionStatus } from '../supabase/useSession'

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

const LINK = 'cursor-pointer text-accent underline hover:no-underline'

// Treść panelu z danymi wspólnymi (historia, notatki): zależnie od stanu
// pokazuje zachętę do logowania, ładowanie, błąd z ponowieniem albo dzieci.
export function RemotePanel({ sessionStatus, listStatus, subject, onSignInClick, onRetry, actionError, children }: RemotePanelProps) {
  if (sessionStatus === 'signedOut') {
    return (
      <p className="text-muted">
        <button type="button" className={LINK} onClick={onSignInClick}>Zaloguj się</button>, aby zobaczyć {subject}.
      </p>
    )
  }
  if (listStatus === 'error') {
    return (
      <p className="text-muted" role="alert">
        Nie udało się wczytać danych. <button type="button" className={LINK} onClick={onRetry}>Spróbuj ponownie</button>
      </p>
    )
  }
  if (listStatus !== 'ready') return <p className="text-muted">Ładowanie…</p>
  return (
    <>
      {actionError && <p className="mb-2.5 text-[0.85rem] text-danger" role="alert">{actionError}</p>}
      {children}
    </>
  )
}
