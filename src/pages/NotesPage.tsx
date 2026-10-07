import type { Notes } from '../notes/useNotes'
import type { SessionStatus } from '../supabase/useSession'
import { NotesPanel } from '../components/NotesPanel'
import { PageFrame } from '../components/PageFrame'
import { RemotePanel } from '../components/RemotePanel'

interface NotesPageProps {
  sessionStatus: SessionStatus
  // Hook wspólnych notatek z `App`.
  notes: Notes
  onSignInClick: () => void
}

// Strona „Notatki": wspólna lista zadań zespołu.
export function NotesPage({ sessionStatus, notes, onSignInClick }: NotesPageProps) {
  return (
    <PageFrame title="Notatki" description="Wspólna lista rzeczy do zrobienia. Każda zalogowana osoba może dodawać, odhaczać, poprawiać i usuwać.">
      <RemotePanel
        sessionStatus={sessionStatus}
        listStatus={notes.status}
        subject="wspólne notatki"
        onSignInClick={onSignInClick}
        onRetry={notes.reload}
        actionError={notes.actionError}
      >
        <NotesPanel notes={notes} />
      </RemotePanel>
    </PageFrame>
  )
}
