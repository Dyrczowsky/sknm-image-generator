import type { useHistory } from '../history/useHistory'
import type { SessionStatus } from '../supabase/useSession'
import type { HistoryEntry, PosterLang } from '../types'
import { HistoryList } from '../components/HistoryList'
import { PageFrame } from '../components/PageFrame'
import { RemotePanel } from '../components/RemotePanel'

interface HistoryPageProps {
  sessionStatus: SessionStatus
  // Hook wspólnej historii z `App` (pozycje, przeładowanie, usuwanie).
  history: ReturnType<typeof useHistory>
  lang: PosterLang
  onSignInClick: () => void
  // `App` otwiera wpis jako nową, niezapisaną pracę i przechodzi do edytora.
  onRestore: (entry: HistoryEntry) => void
}

// Strona „Historia": wspólna lista pobranych plakatów całego zespołu.
export function HistoryPage({ sessionStatus, history, lang, onSignInClick, onRestore }: HistoryPageProps) {
  return (
    <PageFrame title="Historia" description="Każdy pobrany plakat zespołu. „Przywróć” otwiera wpis w edytorze jako nową wersję roboczą — niczego nie nadpisuje.">
      <RemotePanel
        sessionStatus={sessionStatus}
        listStatus={history.status}
        subject="wspólną historię plakatów"
        onSignInClick={onSignInClick}
        onRetry={history.reload}
        actionError={history.actionError}
      >
        <HistoryList entries={history.items} onRestore={onRestore} onDelete={(id) => void history.remove(id)} lang={lang} />
      </RemotePanel>
    </PageFrame>
  )
}
