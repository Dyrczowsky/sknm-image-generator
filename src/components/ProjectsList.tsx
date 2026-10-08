import { useState } from 'react'
import type { FormEvent } from 'react'
import { PROJECT_NAME_MAX } from '../projects/remoteProjects'
import type { ProjectRow } from '../projects/remoteProjects'
import { posterRegistry } from '../posters/registry'
import { parseSnapshot } from '../snapshot/snapshot'
import { formatTimestamp } from '../utils/formatDate'
import { CARD_GRID, THUMB_BOX, THUMB_FIELD, cardClass } from './cardStyles'
import { CardSection, EmptyNote } from './cards'
import { SnapshotThumb } from './SnapshotThumb'
import { Badge, Button, ConfirmButton, IconButton, Input } from './ui'

const KNOWN_LAYOUTS = Object.keys(posterRegistry)

interface ProjectsListProps {
  projects: ProjectRow[]
  userId: string
  // Projekt otwarty w edytorze.
  currentId: number | null
  onOpen: (row: ProjectRow) => void
  onRename: (row: ProjectRow, name: string) => void
  onShare: (row: ProjectRow, shared: boolean) => void
  onDelete: (row: ProjectRow) => void
}

type Callbacks = Pick<ProjectsListProps, 'onOpen' | 'onRename' | 'onShare' | 'onDelete'>

interface ProjectCardProps extends Callbacks {
  row: ProjectRow
  own: boolean
  current: boolean
}

// Karta projektu: miniatura (otwiera projekt), nazwa, data i akcje. „Zmień
// nazwę" zamienia nazwę w pole z zatwierdzeniem i anulowaniem.
function ProjectCard({ row, own, current, onOpen, onRename, onShare, onDelete }: ProjectCardProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const parsed = parseSnapshot(row.snapshot, KNOWN_LAYOUTS)

  const save = (e: FormEvent) => {
    e.preventDefault()
    const name = draft?.trim()
    if (!name) return
    if (name !== row.name) onRename(row, name)
    setDraft(null)
  }

  const thumb = parsed.ok ? (
    <SnapshotThumb snapshot={parsed.snapshot} box={THUMB_BOX} />
  ) : (
    <div className="bg-border" style={{ width: THUMB_BOX, height: THUMB_BOX }} />
  )

  return (
    <li aria-current={current ? 'true' : undefined} className={cardClass(current)}>
      {parsed.ok ? (
        // Duplikuje przycisk „Otwórz" poniżej, więc poza kolejką klawiatury.
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${own ? 'Otwórz' : 'Otwórz kopię'}: ${row.name}`}
          className={`${THUMB_FIELD} cursor-pointer border-0 transition-colors hover:bg-fg/[0.06]`}
          onClick={() => onOpen(row)}
        >
          <span className="overflow-hidden rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.25)]">{thumb}</span>
        </button>
      ) : (
        <div className={THUMB_FIELD}>{thumb}</div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex min-w-0 flex-col gap-1">
          {draft === null ? (
            <div className="flex min-w-0 items-center gap-2">
              <strong className="min-w-0 truncate text-[0.9375rem]" title={row.name}>{row.name}</strong>
              {current && <Badge tone="accent" icon="check">Otwarty</Badge>}
            </div>
          ) : (
            <form className="flex min-w-0 items-center gap-1.5" onSubmit={save}>
              <Input
                size="sm"
                className="flex-1"
                value={draft}
                maxLength={PROJECT_NAME_MAX}
                autoFocus
                aria-label="Nazwa projektu"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setDraft(null)
                }}
              />
              <IconButton type="submit" icon="check" label="Zapisz nazwę" disabled={!draft.trim()} />
              <IconButton icon="close" label="Anuluj zmianę nazwy" onClick={() => setDraft(null)} />
            </form>
          )}
          <span className="truncate text-[0.8125rem] text-muted">zmieniono {formatTimestamp(row.updated_at)}</span>
          {!own && <span className="truncate text-[0.8125rem] text-muted" title={row.owner_email}>Udostępnił(a): {row.owner_email}</span>}
          {!parsed.ok && <span className="text-[0.8125rem] text-muted">Wymaga nowszej wersji aplikacji</span>}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          {parsed.ok && (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" icon="projects" className="flex-1" onClick={() => onOpen(row)}>
                {own ? 'Otwórz' : 'Otwórz kopię'}
              </Button>
              {own && draft === null && <IconButton icon="pencil" label="Zmień nazwę" onClick={() => setDraft(row.name)} />}
            </div>
          )}
          {own && (
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
              <Button
                variant="ghost"
                icon={row.shared ? 'check' : 'share'}
                // Stała nazwa; stan niesie `aria-pressed`, napis tylko go opisuje.
                aria-label={`Udostępnij zespołowi: ${row.name}`}
                aria-pressed={row.shared}
                onClick={() => onShare(row, !row.shared)}
              >
                {row.shared ? 'Udostępniony zespołowi' : 'Udostępnij zespołowi'}
              </Button>
              <ConfirmButton
                icon="trash"
                variant="danger"
                question={row.shared ? 'Usunąć projekt? Zniknie też dla zespołu.' : 'Usunąć projekt na stałe?'}
                onConfirm={() => onDelete(row)}
              >
                Usuń
              </ConfirmButton>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

interface ProjectGridProps extends Callbacks {
  rows: ProjectRow[]
  userId: string
  currentId: number | null
}

function ProjectGrid({ rows, userId, currentId, ...callbacks }: ProjectGridProps) {
  return (
    <ul className={CARD_GRID}>
      {rows.map((row) => (
        <ProjectCard key={row.id} row={row} own={row.owner === userId} current={row.id === currentId} {...callbacks} />
      ))}
    </ul>
  )
}

// Projekty w chmurze w dwóch sekcjach: własne (otwórz, nazwa, udostępnianie,
// usuwanie) i udostępnione przez innych (tylko „Otwórz kopię" - oryginału nie
// da się zmienić).
export function ProjectsList({ projects, userId, currentId, onOpen, onRename, onShare, onDelete }: ProjectsListProps) {
  const mine = projects.filter((row) => row.owner === userId)
  const others = projects.filter((row) => row.owner !== userId)
  const callbacks = { userId, currentId, onOpen, onRename, onShare, onDelete }

  return (
    <div className="flex flex-col gap-8">
      <CardSection title="Moje projekty" count={mine.length}>
        {mine.length === 0 ? (
          <EmptyNote>Nie masz jeszcze zapisanych projektów. Zapisz plakat w edytorze albo zacznij od nowego.</EmptyNote>
        ) : (
          <ProjectGrid rows={mine} {...callbacks} />
        )}
      </CardSection>
      <CardSection title="Udostępnione przez zespół" count={others.length}>
        {others.length === 0 ? (
          <EmptyNote>Nikt jeszcze nie udostępnił zespołowi swojego projektu.</EmptyNote>
        ) : (
          <ProjectGrid rows={others} {...callbacks} />
        )}
      </CardSection>
    </div>
  )
}
