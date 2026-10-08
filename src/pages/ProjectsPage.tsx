import type { ProjectRow } from '../projects/remoteProjects'
import type { Projects } from '../projects/useProjects'
import type { SessionStatus } from '../supabase/useSession'
import { PageFrame } from '../components/PageFrame'
import { ProjectsList } from '../components/ProjectsList'
import { RemotePanel } from '../components/RemotePanel'
import { Button } from '../components/ui'

interface ProjectsPageProps {
  sessionStatus: SessionStatus
  // Hook listy projektów z `App` (stan, pozycje, przeładowanie, błąd zmiany).
  projects: Projects
  // Identyfikator zalogowanej osoby - odróżnia własne projekty od udostępnionych.
  userId: string
  // Projekt otwarty w edytorze.
  currentId: number | null
  onSignInClick: () => void
  // `App` otwiera projekt i po udanym otwarciu przechodzi do edytora.
  onOpen: (row: ProjectRow) => void
  onRename: (row: ProjectRow, name: string) => void
  onShare: (row: ProjectRow, shared: boolean) => void
  onDelete: (row: ProjectRow) => void
  // Pusty plakat jako nowa wersja robocza (i przejście do edytora).
  onNew: () => void
}

// Strona „Projekty": projekty zalogowanej osoby i udostępnione zespołowi.
export function ProjectsPage({ sessionStatus, projects, userId, currentId, onSignInClick, onOpen, onRename, onShare, onDelete, onNew }: ProjectsPageProps) {
  return (
    <PageFrame
      title="Projekty"
      description="Twoje zapisane plakaty i te, które inni udostępnili zespołowi. Otwarty projekt zapisuje się sam."
      actions={<Button icon="newProject" onClick={onNew}>Nowy projekt</Button>}
    >
      <RemotePanel
        sessionStatus={sessionStatus}
        listStatus={projects.status}
        subject="swoje projekty"
        onSignInClick={onSignInClick}
        onRetry={projects.reload}
        actionError={projects.actionError}
      >
        <ProjectsList
          projects={projects.items}
          userId={userId}
          currentId={currentId}
          onOpen={onOpen}
          onRename={onRename}
          onShare={onShare}
          onDelete={onDelete}
        />
      </RemotePanel>
    </PageFrame>
  )
}
