import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { SlideEditContext } from '../../slides/defineSlide'
import type { SlideEdit } from '../../slides/defineSlide'
import { SlideScaled } from '../../slides/SlideScaled'
import { SlideView } from '../../slides/SlideView'
import type { Deck, Slide, SlideAspect } from '../../slides/types'
import { dropSlot, slotToIndex } from '../../slides/useDeckEditor'
import type { OverflowMap } from '../../slides/useDeckEditor'
import { useMediaQuery } from '../../utils/useMediaQuery'
import { NARROW_QUERY, POPOVER_PANEL } from '../styles'
import { Button, Icon, IconButton, Popover } from '../ui'
import type { IconName } from '../ui'
import { LayoutGallery } from './LayoutGallery'

interface SlideStripProps {
  deck: Deck
  aspect: SlideAspect
  selected: number
  overflow: OverflowMap
  onSelect: (index: number) => void
  onMove: (from: number, to: number) => void
  onDuplicate: (index: number) => void
  onRemove: (index: number) => void
  onAdd: (layoutKey: string) => void
  onOverflow: (slideId: string, id: string, overflowing: boolean) => void
}

const THUMB_WIDTH = 176
// Poniżej 900 px pasek jest poziomy, a miniatury mniejsze.
const THUMB_WIDTH_NARROW = 132

interface ThumbProps {
  deck: Pick<Deck, 'theme'>
  slide: Slide
  index: number
  total: number
  aspect: SlideAspect
  width: number
  onOverflow: (slideId: string, id: string, overflowing: boolean) => void
}

// Miniatura tylko do odczytu, ale zgłasza przepełnienie - dzięki temu ⚠ widać
// przy każdym slajdzie, nie tylko przy otwartym. Memo: pisanie na jednym
// slajdzie nie rysuje od nowa pozostałych.
const Thumb = memo(function Thumb({ deck, slide, index, total, aspect, width, onOverflow }: ThumbProps) {
  const edit = useMemo<SlideEdit>(
    () => ({ editable: false, onText: () => {}, onOverflow: (id, overflowing) => onOverflow(slide.id, `strip:${id}`, overflowing) }),
    [onOverflow, slide.id],
  )
  return (
    <SlideEditContext.Provider value={edit}>
      <SlideScaled width={width} aspect={aspect}>
        <SlideView deck={deck} slide={slide} index={index} total={total} aspect={aspect} />
      </SlideScaled>
    </SlideEditContext.Provider>
  )
})

interface DragState {
  from: number
  pointerId: number
  startX: number
  startY: number
  active: boolean
}

const DRAG_THRESHOLD = 6

interface MenuState {
  index: number
  x: number
  y: number
  // Element, do którego wraca fokus po zamknięciu.
  returnTo: HTMLElement | null
  // Przycisk, który otworzył menu - jego kliknięcie przełącza, a nie zamyka i otwiera od nowa.
  anchor: HTMLElement | null
}

// Lewy pasek z miniaturami. Lista to `listbox`: ↑/↓ wybierają slajd, Alt+↑/↓
// przesuwają go; przeciąganie wskaźnikiem pokazuje linię miejsca upuszczenia.
export function SlideStrip({ deck, aspect, selected, overflow, onSelect, onMove, onDuplicate, onRemove, onAdd, onOverflow }: SlideStripProps) {
  const listRef = useRef<HTMLOListElement>(null)
  const drag = useRef<DragState | null>(null)
  const [slot, setSlot] = useState<number | null>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const narrow = useMediaQuery(NARROW_QUERY)
  const total = deck.slides.length
  const theme = useMemo(() => ({ theme: deck.theme }), [deck.theme])
  const selectedId = deck.slides[selected]?.id
  const width = narrow ? THUMB_WIDTH_NARROW : THUMB_WIDTH

  // Zaznaczony slajd zawsze w zasięgu wzroku (dodanie, skróty, cofanie).
  useEffect(() => {
    if (!selectedId) return
    const item = listRef.current?.querySelector<HTMLElement>(`[data-slide-id="${selectedId}"]`)
    item?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [selectedId])

  const centers = () => {
    const list = listRef.current
    if (!list) return []
    return [...list.querySelectorAll<HTMLElement>('[data-slide-id]')].map((el) => {
      const rect = el.getBoundingClientRect()
      return narrow ? rect.left + rect.width / 2 : rect.top + rect.height / 2
    })
  }

  const onPointerDown = (event: PointerEvent<HTMLLIElement>, index: number) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-no-drag]')) return
    drag.current = { from: index, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false }
  }

  const onPointerMove = (event: PointerEvent<HTMLOListElement>) => {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    if (!state.active) {
      if (Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < DRAG_THRESHOLD) return
      state.active = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    setSlot(dropSlot(narrow ? event.clientX : event.clientY, centers()))
  }

  const endDrag = (commit: boolean) => {
    const state = drag.current
    drag.current = null
    if (state?.active && commit && slot !== null) {
      const to = slotToIndex(state.from, slot)
      if (to !== state.from) onMove(state.from, to)
    }
    setSlot(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.target !== event.currentTarget) return
    const back = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    if (back || forward) {
      event.preventDefault()
      if (event.altKey) onMove(selected, selected + (back ? -1 : 1))
      else onSelect(selected + (back ? -1 : 1))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      onSelect(event.key === 'Home' ? 0 : total - 1)
    } else if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault()
      const item = listRef.current?.querySelector<HTMLElement>(`[data-slide-id="${selectedId}"]`)
      const rect = item?.getBoundingClientRect()
      if (rect) setMenu({ index: selected, x: rect.right - 8, y: rect.top + 8, returnTo: event.currentTarget, anchor: null })
    }
  }

  const dropLine = (index: number) =>
    slot === index ? (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full bg-accent ${narrow ? '-left-[9px] top-0 bottom-0 w-[3px]' : '-top-[9px] right-0 left-6 h-[3px]'}`}
      />
    ) : null

  return (
    <nav aria-label="Slajdy" className={`flex min-h-0 min-w-0 bg-surface ${narrow ? 'flex-row items-center' : 'flex-1 flex-col'}`}>
      <ol
        ref={listRef}
        role="listbox"
        aria-label="Slajdy prezentacji"
        aria-orientation={narrow ? 'horizontal' : 'vertical'}
        aria-activedescendant={selectedId ? `slide-option-${selectedId}` : undefined}
        tabIndex={0}
        data-deck-scope=""
        className={`m-0 flex min-h-0 list-none gap-4 overflow-auto p-3 focus-visible:-outline-offset-2 ${narrow ? 'min-w-0 flex-1 flex-row items-start' : 'flex-1 flex-col'}`}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => endDrag(true)}
        onPointerCancel={() => endDrag(false)}
      >
        {deck.slides.map((slide, index) => {
          const active = index === selected
          const warn = Boolean(overflow[slide.id]?.size)
          return (
            <li
              key={slide.id}
              id={`slide-option-${slide.id}`}
              data-slide-id={slide.id}
              role="option"
              aria-selected={active}
              aria-label={`Slajd ${index + 1}${warn ? ' - tekst się nie mieści' : ''}`}
              className={`group relative flex flex-none select-none items-start gap-2 ${slot !== null ? 'cursor-grabbing' : 'cursor-pointer'}`}
              onPointerDown={(event) => onPointerDown(event, index)}
              onClick={() => onSelect(index)}
              onContextMenu={(event) => {
                event.preventDefault()
                onSelect(index)
                setMenu({ index, x: event.clientX + MENU_WIDTH, y: event.clientY, returnTo: listRef.current, anchor: null })
              }}
            >
              {dropLine(index)}
              <span className={`w-4 flex-none pt-0.5 text-right text-[0.75rem] font-semibold tabular-nums ${active ? 'text-accent-text' : 'text-muted'}`}>{index + 1}</span>
              <span
                className={`relative block overflow-hidden rounded-md transition-shadow duration-150 ${
                  active ? 'shadow-[0_0_0_2px_var(--accent)]' : 'shadow-[0_0_0_1px_var(--border)] group-hover:shadow-[0_0_0_1px_var(--muted)]'
                }`}
              >
                <Thumb deck={theme} slide={slide} index={index} total={total} aspect={aspect} width={width} onOverflow={onOverflow} />
                {warn && (
                  <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-surface px-1.5 py-0.5 text-[0.75rem] font-semibold text-warning shadow-pop" title="Tekst się nie mieści">
                    <Icon name="warning" />
                  </span>
                )}
              </span>
              <span
                data-no-drag=""
                className={`absolute top-1 right-1 transition-opacity duration-150 ${narrow || menu?.index === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}
              >
                <IconButton
                  icon="more"
                  label={`Akcje slajdu ${index + 1}`}
                  variant="outline"
                  className="!size-8 !min-h-0 bg-surface"
                  aria-haspopup="menu"
                  aria-expanded={menu?.index === index}
                  onClick={(event) => {
                    event.stopPropagation()
                    const rect = event.currentTarget.getBoundingClientRect()
                    setMenu(menu?.index === index ? null : { index, x: rect.right, y: rect.bottom + 4, returnTo: event.currentTarget, anchor: event.currentTarget })
                  }}
                />
              </span>
            </li>
          )
        })}
        {slot === total && (
          <li aria-hidden="true" className={`relative flex-none ${narrow ? 'w-0 self-stretch' : 'h-0'}`}>
            {dropLine(total)}
          </li>
        )}
      </ol>
      <div className={`flex flex-none border-border ${narrow ? 'border-l p-2' : 'border-t p-3'}`}>
        <AddSlideButton deck={deck} aspect={aspect} onAdd={onAdd} compact={narrow} />
      </div>
      {menu && deck.slides[menu.index] && (
        <SlideMenu
          menu={menu}
          total={total}
          onClose={() => {
            const target = menu.returnTo
            setMenu(null)
            target?.focus()
          }}
          onDuplicate={() => onDuplicate(menu.index)}
          onMove={(to) => onMove(menu.index, to)}
          onRemove={() => onRemove(menu.index)}
        />
      )}
    </nav>
  )
}

interface AddSlideButtonProps {
  deck: Deck
  aspect: SlideAspect
  onAdd: (layoutKey: string) => void
  // Pełny przycisk z napisem (pasek) albo sama ikona.
  compact?: boolean
}

// „+ Nowy slajd" pod listą: galeria układów otwiera się w górę.
export function AddSlideButton({ deck, aspect, onAdd, compact = false }: AddSlideButtonProps) {
  return (
    <Popover
      label="Nowy slajd"
      side={compact ? 'bottom' : 'top'}
      align={compact ? 'end' : 'start'}
      className="max-h-[70dvh] overflow-y-auto"
      trigger={(props) =>
        compact ? (
          <IconButton {...props} icon="plus" label="Nowy slajd" variant="outline" />
        ) : (
          <Button {...props} icon="plus" variant="outline" fullWidth>
            Nowy slajd
          </Button>
        )
      }
    >
      {(close) => (
        <LayoutGallery
          theme={deck.theme}
          aspect={aspect}
          onPick={(key) => {
            close()
            onAdd(key)
          }}
        />
      )}
    </Popover>
  )
}

interface SlideMenuProps {
  menu: MenuState
  total: number
  onClose: () => void
  onDuplicate: () => void
  onMove: (to: number) => void
  onRemove: () => void
}

const MENU_WIDTH = 208

// Menu slajdu w `position: fixed` - pasek przewija się i przyciąłby zwykły
// Popover. Escape, kliknięcie obok i wyjście fokusem zamykają.
function SlideMenu({ menu, total, onClose, onDuplicate, onMove, onRemove }: SlideMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: menu.x - MENU_WIDTH, top: menu.y })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const left = Math.min(Math.max(8, menu.x - MENU_WIDTH), window.innerWidth - rect.width - 8)
    const top = menu.y + rect.height > window.innerHeight - 8 ? Math.max(8, menu.y - rect.height - 8) : menu.y
    setPos({ left, top })
    el.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus()
  }, [menu.x, menu.y])

  useEffect(() => {
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && (ref.current?.contains(event.target) || menu.anchor?.contains(event.target))) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose, menu.anchor])

  const run = (action: () => void) => () => {
    onClose()
    action()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    event.stopPropagation()
    const items = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])]
    const at = items.indexOf(document.activeElement as HTMLElement)
    const next = items[(at + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]
    next?.focus()
  }

  const items: { icon: IconName; label: string; disabled: boolean; action: () => void }[] = [
    { icon: 'copy', label: 'Duplikuj', disabled: false, action: onDuplicate },
    { icon: 'arrowUp', label: 'Przenieś w górę', disabled: menu.index === 0, action: () => onMove(menu.index - 1) },
    { icon: 'arrowDown', label: 'Przenieś w dół', disabled: menu.index === total - 1, action: () => onMove(menu.index + 1) },
    { icon: 'trash', label: 'Usuń slajd', disabled: total <= 1, action: onRemove },
  ]

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={`Slajd ${menu.index + 1}`}
      className={`fixed z-40 flex flex-col gap-0.5 !p-1.5 ${POPOVER_PANEL}`}
      style={{ left: pos.left, top: pos.top, width: MENU_WIDTH }}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => (
        <Button key={item.label} role="menuitem" variant="ghost" align="start" fullWidth icon={item.icon} disabled={item.disabled} onClick={run(item.action)}>
          {item.label}
        </Button>
      ))}
    </div>
  )
}
