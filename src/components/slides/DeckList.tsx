import { useState } from 'react'
import type { DeckIndexEntry } from '../../slides/deckStore'
import { layoutOf } from '../../slides/komponenty'
import { formatTimestamp } from '../../utils/formatDate'
import { CARD_GRID, cardClass } from '../cardStyles'
import { CardSection } from '../cards'
import { PageFrame } from '../PageFrame'
import { Button, ConfirmButton, Icon, IconButton, Popover } from '../ui'

export type NewDeckKind = 'starter' | 'empty'

interface DeckListProps {
  ready: boolean
  items: readonly DeckIndexEntry[]
  error: string | null
  onCreate: (kind: NewDeckKind) => void
  onOpen: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  // Teraz (ms) - do względnych dat; podawane w testach.
  now?: number
}

// „1 slajd", „3 slajdy", „12 slajdów".
function slideCount(n: number): string {
  if (n === 1) return '1 slajd'
  const tens = n % 100
  const ones = n % 10
  if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) return `${n} slajdy`
  return `${n} slajdów`
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE

function changedAgo(at: number, now: number): string {
  const diff = now - at
  if (!(at > 0)) return ''
  if (diff < MINUTE) return 'przed chwilą'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min temu`
  if (diff < 24 * HOUR && new Date(at).getDate() === new Date(now).getDate()) return `dziś, ${formatTimestamp(new Date(at).toISOString()).slice(11)}`
  return formatTimestamp(new Date(at).toISOString())
}

// Lista prezentacji zapisanych na tym urządzeniu: karty z nazwą, liczbą
// slajdów i datą zmiany, „Nowa prezentacja" z szablonu albo pusta.
export function DeckList({ ready, items, error, onCreate, onOpen, onDuplicate, onRemove, now: fixedNow }: DeckListProps) {
  // Daty względne liczone od wejścia na listę - wystarczy, lista nie wisi otwarta godzinami.
  const [openedAt] = useState(() => Date.now())
  const now = fixedNow ?? openedAt
  const create = (
    <Popover
      label="Nowa prezentacja"
      role="menu"
      align="end"
      trigger={(props) => (
        <Button {...props} variant="primary" icon="plus" iconEnd="chevronDown">
          Nowa prezentacja
        </Button>
      )}
    >
      {(close) => (
        <div className="flex w-72 flex-col gap-0.5">
          <NewChoice
            title="Z szablonu „Poznajmy się”"
            hint="11 gotowych slajdów o kole - podmień treść i zdjęcia."
            onClick={() => {
              close()
              onCreate('starter')
            }}
          />
          <NewChoice
            title="Pusta"
            hint="Sam slajd tytułowy - kolejne dodasz z galerii układów."
            onClick={() => {
              close()
              onCreate('empty')
            }}
          />
        </div>
      )}
    </Popover>
  )

  return (
    <PageFrame
      title="Prezentacje"
      description="Pokazy slajdów z gotowych układów SKNM, w formacie 16:9 i 1:1. Zapisują się na tym urządzeniu."
      actions={create}
    >
      {error && (
        <p className="m-0 mb-4 flex items-center gap-2 text-danger" role="alert">
          <Icon name="alert" />
          {error}
        </p>
      )}
      {!ready ? (
        <p className="m-0 text-muted">Wczytywanie prezentacji…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <Icon name="presentations" size="lg" className="text-muted" />
          <h2 className="m-0 text-[0.9375rem] font-bold">Nie masz jeszcze żadnej prezentacji</h2>
          <p className="m-0 max-w-[52ch] text-muted">
            Złóż pokaz z gotowych slajdów - tytułowych, z listami, zdjęciami i zaproszeniem - edytuj tekst bezpośrednio na slajdzie, a potem
            pokaż go na pełnym ekranie albo pobierz jako PDF, PNG lub HTML.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" icon="presentations" onClick={() => onCreate('starter')}>
              Zacznij od szablonu „Poznajmy się”
            </Button>
            <Button variant="ghost" icon="plus" onClick={() => onCreate('empty')}>
              Pusta prezentacja
            </Button>
          </div>
        </div>
      ) : (
        <CardSection title="Na tym urządzeniu" count={items.length}>
          <ul className={CARD_GRID}>
            {items.map((item) => (
              <DeckCard key={item.id} item={item} now={now} onOpen={onOpen} onDuplicate={onDuplicate} onRemove={onRemove} />
            ))}
          </ul>
        </CardSection>
      )}
    </PageFrame>
  )
}

function NewChoice({ title, hint, onClick }: { title: string; hint: string; onClick: () => void }) {
  return (
    <Button role="menuitem" variant="ghost" align="start" fullWidth className="!h-auto py-2" onClick={onClick}>
      <span className="flex flex-col items-start gap-0.5 text-left">
        <span>{title}</span>
        <span className="text-[0.75rem] font-normal whitespace-normal text-muted">{hint}</span>
      </span>
    </Button>
  )
}

interface DeckCardProps {
  item: DeckIndexEntry
  now: number
  onOpen: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

function DeckCard({ item, now, onOpen, onDuplicate, onRemove }: DeckCardProps) {
  const layout = item.firstLayout ? layoutOf(item.firstLayout) : undefined
  const ago = changedAgo(item.updatedAt, now)
  return (
    <li className={cardClass()}>
      {/* Duplikuje przycisk „Otwórz" poniżej, więc poza kolejką klawiatury. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Otwórz: ${item.name}`}
        className="flex aspect-[16/9] w-full cursor-pointer items-center justify-center border-0 bg-sunken text-muted transition-colors hover:bg-fg/[0.06]"
        onClick={() => onOpen(item.id)}
      >
        <Icon name={layout?.icon ?? 'presentations'} size="lg" />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex min-w-0 flex-col gap-1">
          <strong className="min-w-0 truncate text-[0.9375rem]" title={item.name}>
            {item.name}
          </strong>
          <span className="truncate text-[0.8125rem] text-muted">
            {slideCount(item.slideCount)}
            {ago && ` · zmieniono ${ago}`}
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Button icon="presentations" className="flex-1" onClick={() => onOpen(item.id)}>
              Otwórz
            </Button>
            <IconButton icon="copy" label={`Duplikuj: ${item.name}`} onClick={() => onDuplicate(item.id)} />
          </div>
          <div className="flex justify-end">
            <ConfirmButton icon="trash" question="Usunąć prezentację z tego urządzenia?" onConfirm={() => onRemove(item.id)}>
              Usuń
            </ConfirmButton>
          </div>
        </div>
      </div>
    </li>
  )
}
