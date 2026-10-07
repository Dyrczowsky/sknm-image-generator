import { useState } from 'react'
import type { FormEvent } from 'react'
import { PROJECT_NAME_MAX } from '../projects/remoteProjects'
import type { ProjectRow } from '../projects/remoteProjects'
import { posterRegistry } from '../posters/registry'
import { parseSnapshot } from '../snapshot/snapshot'
import { formatTimestamp } from '../utils/formatDate'
import type { PosterLang } from '../types'
import { SnapshotThumb } from './SnapshotThumb'
import { CHECKBOX, COMPACT_INPUT, ROW_ACTION } from './styles'

const KNOWN_LAYOUTS = Object.keys(posterRegistry)
const THUMB_SIZE = 120

interface ProjectsListProps {
  projects: ProjectRow[]
  userId: string
  // Projekt otwarty w edytorze.
  currentId: number | null
  // Język plakatu; miniatury nieczytelnych snapshotów go nie potrzebują.
  lang?: PosterLang
  onOpen: (row: ProjectRow) => void
  onRename: (row: ProjectRow, name: string) => void
  onShare: (row: ProjectRow, shared: boolean) => void
  onDelete: (row: ProjectRow) => void
}

type Callbacks = Pick<ProjectsListProps, 'onOpen' | 'onRename' | 'onShare' | 'onDelete'>

interface ProjectItemProps extends Callbacks {
  row: ProjectRow
  own: boolean
  current: boolean
}

// Jeden projekt; „Zmień nazwę" zamienia nazwę w pole z „Zapisz" / „Anuluj".
function ProjectItem({ row, own, current, onOpen, onRename, onShare, onDelete }: ProjectItemProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const parsed = parseSnapshot(row.snapshot, KNOWN_LAYOUTS)

  const save = (e: FormEvent) => {
    e.preventDefault()
    const name = draft?.trim()
    if (!name) return
    if (name !== row.name) onRename(row, name)
    setDraft(null)
  }

  const remove = () => {
    if (window.confirm(`Usunąć projekt „${row.name}"? Tej operacji nie można cofnąć.`)) onDelete(row)
  }

  return (
    <li
      aria-current={current ? 'true' : undefined}
      className={`flex flex-wrap items-center gap-3.5 rounded-[10px] border bg-bg px-3.5 py-2.5 text-[0.9rem] ${current ? 'border-accent' : 'border-border'}`}
    >
      <div className="flex-none overflow-hidden rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
        {parsed.ok ? (
          <SnapshotThumb snapshot={parsed.snapshot} box={THUMB_SIZE} />
        ) : (
          <div className="bg-border" style={{ width: THUMB_SIZE, height: THUMB_SIZE }} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {draft === null ? (
          <strong className="flex min-w-0 items-center gap-2">
            <span className="truncate">{row.name}</span>
            {current && <span className="flex-none rounded-md bg-accent-soft px-1.5 py-0.5 text-[0.7rem] font-medium text-accent">Otwarty</span>}
          </strong>
        ) : (
          <form className="flex min-w-0 flex-wrap gap-2" onSubmit={save}>
            <input
              className={`min-w-0 flex-1 ${COMPACT_INPUT}`}
              value={draft}
              maxLength={PROJECT_NAME_MAX}
              autoFocus
              aria-label="Nazwa projektu"
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className={`${ROW_ACTION} hover:border-accent hover:text-accent`}>Zapisz</button>
            <button type="button" className={ROW_ACTION} onClick={() => setDraft(null)}>Anuluj</button>
          </form>
        )}
        <span className="truncate text-[0.8rem] text-muted">zmieniono {formatTimestamp(row.updated_at)}</span>
        {!own && <span className="truncate text-[0.8rem] text-muted">Udostępnił(a): {row.owner_email}</span>}
        {!parsed.ok && <span className="text-[0.8rem] text-muted">Wymaga nowszej wersji aplikacji</span>}
        {own && (
          <label className="flex cursor-pointer items-center gap-2 text-[0.8rem]">
            <input type="checkbox" className={CHECKBOX} checked={row.shared} onChange={(e) => onShare(row, e.target.checked)} />
            Udostępnij zespołowi
          </label>
        )}
      </div>

      <div className="flex flex-none flex-wrap justify-end gap-2 max-[639px]:basis-full max-[639px]:justify-start">
        {parsed.ok && (
          <button type="button" className={`${ROW_ACTION} hover:border-accent hover:text-accent`} onClick={() => onOpen(row)}>
            {own ? 'Otwórz' : 'Otwórz kopię'}
          </button>
        )}
        {own && draft === null && (
          <button type="button" className={`${ROW_ACTION} hover:border-accent hover:text-accent`} onClick={() => setDraft(row.name)}>
            Zmień nazwę
          </button>
        )}
        {own && (
          <button type="button" className={`${ROW_ACTION} hover:border-danger hover:text-danger`} onClick={remove}>
            Usuń
          </button>
        )}
      </div>
    </li>
  )
}

// Lista projektów w chmurze: własne (otwórz, nazwa, udostępnianie, usuwanie)
// i cudze udostępnione (tylko „Otwórz kopię" - oryginału nie da się zmienić).
export function ProjectsList({ projects, userId, currentId, onOpen, onRename, onShare, onDelete }: ProjectsListProps) {
  if (projects.length === 0) {
    return <p className="text-muted">Nie masz jeszcze zapisanych projektów.</p>
  }

  return (
    <ul className="flex list-none flex-col gap-2.5 p-0">
      {projects.map((row) => (
        <ProjectItem
          key={row.id}
          row={row}
          own={row.owner === userId}
          current={row.id === currentId}
          onOpen={onOpen}
          onRename={onRename}
          onShare={onShare}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
