import { useState } from 'react'
import type { FormEvent } from 'react'
import { NOTE_MAX_LENGTH } from '../notes/remoteNotes'
import type { Note } from '../notes/remoteNotes'
import type { Notes } from '../notes/useNotes'
import { formatTimestamp } from '../utils/formatDate'
import { CHECKBOX, COMPACT_INPUT, ROW_ACTION } from './styles'

interface NoteItemProps {
  note: Note
  notes: Notes
}

// Jedna pozycja listy; „Edytuj" zamienia treść w pole z „Zapisz" / „Anuluj".
function NoteItem({ note, notes }: NoteItemProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const text = draft?.trim()
    if (!text) return
    if (text === note.text || (await notes.change(note.id, { text }))) setDraft(null)
  }

  return (
    <li className="flex items-start gap-3 rounded-[10px] border border-border bg-bg px-3.5 py-2.5 text-[0.9rem]">
      <input
        type="checkbox"
        className={`${CHECKBOX} mt-1`}
        checked={note.done}
        onChange={(e) => void notes.change(note.id, { done: e.target.checked })}
        aria-label={`Zrobione: ${note.text}`}
      />
      {draft === null ? (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className={`whitespace-pre-wrap break-words ${note.done ? 'text-muted line-through' : ''}`}>{note.text}</span>
            <span className="truncate text-[0.8rem] text-muted">{note.author_email} — {formatTimestamp(note.created_at)}</span>
          </div>
          <div className="flex flex-none gap-2">
            <button type="button" className={`${ROW_ACTION} hover:border-accent hover:text-accent`} onClick={() => setDraft(note.text)}>
              Edytuj
            </button>
            <button type="button" className={`${ROW_ACTION} hover:border-danger hover:text-danger`} onClick={() => void notes.remove(note.id)}>
              Usuń
            </button>
          </div>
        </>
      ) : (
        <form className="flex min-w-0 flex-1 flex-wrap gap-2" onSubmit={(e) => void save(e)}>
          <input
            className={`min-w-0 flex-1 ${COMPACT_INPUT}`}
            value={draft}
            maxLength={NOTE_MAX_LENGTH}
            autoFocus
            aria-label="Treść notatki"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className={`${ROW_ACTION} hover:border-accent hover:text-accent`}>Zapisz</button>
          <button type="button" className={ROW_ACTION} onClick={() => setDraft(null)}>Anuluj</button>
        </form>
      )}
    </li>
  )
}

// Wspólna lista zadań: pole dodawania i pozycje (otwarte na górze, zrobione
// niżej). Każdy zalogowany może dodać, odhaczyć, poprawić i usunąć każdą.
export function NotesPanel({ notes }: { notes: Notes }) {
  const [text, setText] = useState('')

  const add = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (trimmed && (await notes.add(trimmed))) setText('')
  }

  return (
    <div className="flex flex-col gap-2.5">
      <form className="flex gap-2" onSubmit={(e) => void add(e)}>
        <input
          className={`min-w-0 flex-1 ${COMPACT_INPUT}`}
          placeholder="Co jest do zrobienia?"
          value={text}
          maxLength={NOTE_MAX_LENGTH}
          aria-label="Nowa notatka"
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className={`${ROW_ACTION} hover:border-accent hover:text-accent`} disabled={!text.trim()}>
          Dodaj
        </button>
      </form>
      {notes.items.length === 0 ? (
        <p className="text-muted">Brak notatek.</p>
      ) : (
        <ul className="flex list-none flex-col gap-2.5 p-0">
          {notes.items.map((note) => (
            <NoteItem key={note.id} note={note} notes={notes} />
          ))}
        </ul>
      )}
    </div>
  )
}
