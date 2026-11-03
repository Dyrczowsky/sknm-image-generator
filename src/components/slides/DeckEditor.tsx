import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { isMacPlatform } from '../../shortcuts/shortcuts'
import type { Decks } from '../../slides/useDecks'
import { deckShortcutFor, useDeckEditor } from '../../slides/useDeckEditor'
import type { DeckEditor as Editor, DeckShortcut } from '../../slides/useDeckEditor'
import type { Deck } from '../../slides/types'
import { Button, Icon, IconButton, Input, Popover } from '../ui'
import { ExportMenu } from './ExportMenu'
import { Inspector } from './Inspector'
import { PresentMode } from './PresentMode'
import { Ribbon } from './Ribbon'
import { SlideCanvas } from './SlideCanvas'
import { SlideStrip } from './SlideStrip'

interface DeckEditorProps {
  deck: Deck
  decks: Pick<Decks, 'save' | 'flush' | 'error'>
  // Powrót do listy prezentacji.
  onClose: () => void
}

const NAME_MAX = 120
// Układ nowego slajdu ze skrótu Ctrl/⌘+M (bez galerii).
const DEFAULT_LAYOUT = 'tekstZdjecia'

// Od 900 px: pasek, wstążka i trzy kolumny (miniatury | slajd | właściwości)
// na wysokość okna. Węziej - jedna kolumna: pasek miniatur, slajd, panel.
const BODY = 'flex flex-col min-[900px]:grid min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:grid-cols-[232px_minmax(0,1fr)_clamp(280px,26%,360px)] min-[900px]:grid-rows-[minmax(0,1fr)]'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

// Edytor jednej prezentacji. Stan (historia, zaznaczenie) trzyma
// `useDeckEditor`, a każda zmiana od razu idzie do zapisu w `useDecks`.
export function DeckEditor({ deck: initial, decks, onClose }: DeckEditorProps) {
  const editor = useDeckEditor(initial, decks.save)
  const [showFrom, setShowFrom] = useState<number | null>(null)
  const { deck, slide, selected } = editor

  useDeckShortcuts(editor, showFrom === null, {
    save: () => void decks.flush(),
    show: setShowFrom,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Prezentacja: {deck.name}</h1>
      <TopBar editor={editor} error={decks.error} onClose={onClose} onShow={setShowFrom} />
      <Ribbon editor={editor} />
      <div className={BODY}>
        <div className="min-h-0 border-border max-[900px]:border-b min-[900px]:flex min-[900px]:flex-col min-[900px]:border-r">
          <SlideStrip
            deck={deck}
            aspect={deck.viewAspect}
            selected={selected}
            overflow={editor.overflow}
            onSelect={editor.select}
            onMove={editor.move}
            onDuplicate={editor.duplicate}
            onRemove={editor.remove}
            onAdd={editor.addSlide}
            onOverflow={editor.onOverflow}
          />
        </div>
        <SlideCanvas
          deck={deck}
          selected={selected}
          aspect={deck.viewAspect}
          overflowing={Boolean(slide && editor.overflow[slide.id]?.size)}
          onText={editor.setText}
          onOverflow={editor.onOverflow}
        />
        <div className="min-h-0 border-border max-[900px]:border-t min-[900px]:flex min-[900px]:flex-col min-[900px]:border-l">
          {slide && <Inspector slide={slide} theme={deck.theme} aspect={deck.viewAspect} onData={editor.setData} onChangeLayout={editor.changeLayout} />}
        </div>
      </div>
      {showFrom !== null && (
        <PresentMode
          deck={deck}
          aspect={deck.viewAspect}
          startIndex={showFrom}
          onExit={(index) => {
            setShowFrom(null)
            editor.select(index)
          }}
        />
      )}
    </div>
  )
}

interface TopBarProps {
  editor: Editor
  error: string | null
  onClose: () => void
  onShow: (index: number) => void
}

function TopBar({ editor, error, onClose, onShow }: TopBarProps) {
  const { deck, selected } = editor
  // `null` = nazwa nie jest edytowana.
  const [draft, setDraft] = useState<string | null>(null)

  const rename = (event: FormEvent) => {
    event.preventDefault()
    const next = draft?.trim()
    if (!next) return
    if (next !== deck.name) editor.setDeckProps({ name: next })
    setDraft(null)
  }

  return (
    <section aria-label="Prezentacja" className="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-bg px-3 py-2 min-[900px]:min-h-14">
      <div className="flex min-w-0 flex-1 basis-full items-center gap-x-2 gap-y-1 min-[900px]:basis-0">
        <IconButton icon="arrowLeft" label="Wszystkie prezentacje" onClick={onClose} />
        {draft !== null ? (
          <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={rename}>
            <Input
              size="sm"
              className="min-w-0 flex-1 min-[900px]:max-w-80"
              value={draft}
              maxLength={NAME_MAX}
              autoFocus
              aria-label="Nazwa prezentacji"
              data-native-undo=""
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setDraft(null)
              }}
            />
            <Button type="submit" disabled={!draft.trim()}>Zmień</Button>
            <Button variant="ghost" onClick={() => setDraft(null)}>Anuluj</Button>
          </form>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1">
              <strong className="min-w-0 truncate text-[0.9375rem] leading-tight" title={deck.name}>{deck.name}</strong>
              <IconButton icon="pencil" label="Zmień nazwę prezentacji" onClick={() => setDraft(deck.name)} />
            </div>
            <span className={`flex min-w-0 items-center gap-1.5 text-[0.8125rem] leading-tight ${error ? 'text-danger' : 'text-muted'}`}>
              <Icon name={error ? 'saveError' : 'local'} />
              <span className="truncate" role="status">{error ?? 'Zapisano na tym urządzeniu'}</span>
            </span>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center">
          <IconButton icon="undo" label="Cofnij" disabled={!editor.canUndo} onClick={editor.undo} />
          <IconButton icon="redo" label="Ponów" disabled={!editor.canRedo} onClick={editor.redo} />
        </span>
        <ExportMenu deck={deck} />
        <span className="inline-flex items-stretch">
          <Button variant="primary" icon="play" className="rounded-r-none" onClick={() => onShow(0)}>
            Pokaz slajdów
          </Button>
          <Popover
            label="Pokaz slajdów"
            role="menu"
            align="end"
            trigger={(props) => <IconButton {...props} icon="chevronDown" label="Więcej opcji pokazu" variant="primary" className="rounded-l-none border-l border-l-on-accent/30" />}
          >
            {(close) => (
              <div className="flex w-56 flex-col gap-0.5">
                <Button role="menuitem" variant="ghost" align="start" fullWidth icon="play" onClick={() => {
                  close()
                  onShow(0)
                }}>
                  Od początku
                </Button>
                <Button role="menuitem" variant="ghost" align="start" fullWidth icon="fullscreen" onClick={() => {
                  close()
                  onShow(selected)
                }}>
                  Od bieżącego slajdu
                </Button>
              </div>
            )}
          </Popover>
        </span>
      </div>
    </section>
  )
}

interface ShortcutHandlers {
  save: () => void
  show: (index: number) => void
}

// Skróty tej strony. Nasłuch w fazie przechwytywania na oknie: obsłużony
// klawisz nie dociera do globalnych skrótów aplikacji (Ctrl/⌘+Enter to tu
// pokaz, nie „Pobierz plakat") ani do pola tekstowego slajdu (Ctrl/⌘+Z cofa
// w historii prezentacji, nie natywnie w polu).
function useDeckShortcuts(editor: Editor, enabled: boolean, handlers: ShortcutHandlers) {
  const latest = useRef({ editor, handlers })
  useEffect(() => {
    latest.current = { editor, handlers }
  })

  useEffect(() => {
    if (!enabled) return
    const isMac = isMacPlatform()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || document.querySelector('dialog[open]')) return
      const action = deckShortcutFor(event, isMac)
      if (!action) return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.closest('[data-native-undo]')) return
      const typing = isTypingTarget(target)
      if (typing && action !== 'undo' && action !== 'redo' && action !== 'save') return
      // Delete usuwa slajd tylko z paska miniatur albo tła sceny - nigdy z przycisku czy panelu.
      if (action === 'remove' && !target?.closest('[data-deck-scope]')) return
      event.preventDefault()
      event.stopPropagation()
      run(action, latest.current.editor, latest.current.handlers)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [enabled])
}

function run(action: DeckShortcut, editor: Editor, handlers: ShortcutHandlers) {
  const total = editor.deck.slides.length
  switch (action) {
    case 'undo':
      return editor.undo()
    case 'redo':
      return editor.redo()
    case 'save':
      return handlers.save()
    case 'duplicate':
      return editor.duplicate()
    case 'remove':
      return editor.remove()
    case 'newSlide':
      return editor.addSlide(DEFAULT_LAYOUT)
    case 'showFromStart':
      return handlers.show(0)
    case 'showFromCurrent':
      return handlers.show(editor.selected)
    case 'prevSlide':
      return editor.select(Math.max(0, editor.selected - 1))
    case 'nextSlide':
      return editor.select(Math.min(total - 1, editor.selected + 1))
  }
}
