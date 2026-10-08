import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { NOTE_MAX_LENGTH } from '../notes/remoteNotes'
import type { Note } from '../notes/remoteNotes'
import type { Notes } from '../notes/useNotes'
import { formatTimestamp } from '../utils/formatDate'
import { CardSection, EmptyNote } from './cards'
import { Button, ConfirmButton, Input } from './ui'

interface NoteItemProps {
  note: Note
  notes: Notes
  // Ta pozycja właśnie zmieniła listę (odhaczenie): po zamontowaniu oddaje fokus swojemu polu wyboru.
  restoreFocus: boolean
  onFocusRestored: () => void
  onToggle: (id: number) => void
}

const CHECK = 'mt-0.5 size-5 flex-none cursor-pointer accent-accent'

// Jedna pozycja listy; „Edytuj" zamienia treść w pole z „Zapisz" / „Anuluj".
// Zrobione notatki są cichsze: bez tła, wyszarzone, treść przekreślona.
function NoteItem({ note, notes, restoreFocus, onFocusRestored, onToggle }: NoteItemProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const check = useRef<HTMLInputElement>(null)

  // Odhaczona notatka przechodzi między listami, więc jej element powstaje na
  // nowo i fokus spada na <body>; wracamy go na pole wyboru w nowym miejscu.
  useEffect(() => {
    if (!restoreFocus) return
    check.current?.focus()
    onFocusRestored()
    // Tylko przy zamontowaniu: wtedy pozycja jest już na nowej liście.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const text = draft?.trim()
    if (!text) return
    if (text === note.text || (await notes.change(note.id, { text }))) setDraft(null)
  }

  return (
    <li className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 ${note.done ? 'border-border bg-transparent' : 'border-border bg-surface'}`}>
      <input
        ref={check}
        type="checkbox"
        className={CHECK}
        checked={note.done}
        onChange={(e) => {
          onToggle(note.id)
          // Nieudana zmiana nie przenosi notatki, więc fokus nie ma po co wracać.
          void notes.change(note.id, { done: e.target.checked }).then((ok) => {
            if (!ok) onFocusRestored()
          })
        }}
        aria-label={`Zrobione: ${note.text}`}
      />
      {draft === null ? (
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={`whitespace-pre-wrap break-words ${note.done ? 'text-muted line-through' : 'text-fg'}`}>{note.text}</span>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="min-w-0 truncate text-[0.8125rem] text-muted">{note.author_email} — {formatTimestamp(note.created_at)}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="ghost" icon="pencil" onClick={() => setDraft(note.text)}>Edytuj</Button>
              <ConfirmButton icon="trash" question="Usunąć notatkę dla całego zespołu?" onConfirm={() => void notes.remove(note.id)}>
                Usuń
              </ConfirmButton>
            </div>
          </div>
        </div>
      ) : (
        <form className="flex min-w-0 flex-1 flex-wrap gap-2" onSubmit={(e) => void save(e)}>
          <Input
            size="sm"
            className="min-w-[12rem] flex-1"
            value={draft}
            maxLength={NOTE_MAX_LENGTH}
            autoFocus
            aria-label="Treść notatki"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setDraft(null)
            }}
          />
          <Button type="submit" variant="outline" icon="check" disabled={!draft.trim()}>Zapisz</Button>
          <Button variant="ghost" onClick={() => setDraft(null)}>Anuluj</Button>
        </form>
      )}
    </li>
  )
}

const LIST = 'm-0 flex list-none flex-col gap-2 p-0'

// Wspólna lista zadań: pole dodawania i pozycje (otwarte na górze, zrobione
// niżej, ciszej). Każdy zalogowany może dodać, odhaczyć, poprawić i usunąć każdą.
// Szerokość ograniczona, żeby wiersze dało się czytać.
export function NotesPanel({ notes }: { notes: Notes }) {
  const [text, setText] = useState('')
  // Notatka, której pole wyboru ma dostać fokus po przejściu na drugą listę.
  const [focusId, setFocusId] = useState<number | null>(null)

  const item = (note: Note) => (
    <NoteItem
      key={note.id}
      note={note}
      notes={notes}
      restoreFocus={note.id === focusId}
      onFocusRestored={() => setFocusId(null)}
      onToggle={setFocusId}
    />
  )

  const add = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (trimmed && (await notes.add(trimmed))) setText('')
  }

  const open = notes.items.filter((note) => !note.done)
  const done = notes.items.filter((note) => note.done)

  return (
    <div className="flex max-w-[44rem] flex-col gap-6">
      <form className="flex gap-2" onSubmit={(e) => void add(e)}>
        <Input
          className="flex-1"
          placeholder="Co jest do zrobienia?"
          value={text}
          maxLength={NOTE_MAX_LENGTH}
          aria-label="Nowa notatka"
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" size="md" variant="primary" icon="plus" disabled={!text.trim()}>Dodaj</Button>
      </form>
      {notes.items.length === 0 ? (
        <EmptyNote>Brak notatek.</EmptyNote>
      ) : (
        <>
          <CardSection title="Do zrobienia" count={open.length}>
            {open.length === 0 ? (
              <EmptyNote>Wszystko zrobione.</EmptyNote>
            ) : (
              <ul className={LIST}>
                {open.map(item)}
              </ul>
            )}
          </CardSection>
          {done.length > 0 && (
            <CardSection title="Zrobione" count={done.length}>
              <ul className={LIST}>
                {done.map(item)}
              </ul>
            </CardSection>
          )}
        </>
      )}
    </div>
  )
}
