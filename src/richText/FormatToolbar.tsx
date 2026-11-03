import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from '../components/ui'
import type { IconName } from '../components/ui'
import { rovingTarget } from '../components/ui/keys'
import { isMacPlatform } from '../shortcuts/shortcuts'
import { MARK } from './format'
import type { Align } from './format'
import { placeToolbar } from './placeToolbar'
import type { Box } from './placeToolbar'
import { listenToolbarRequests, richFieldFor } from './fieldRegistry'
import type { FormatOp, ToolbarState } from './fieldRegistry'

const ALIGN_UNAVAILABLE = 'Wyrównanie niedostępne w tym polu'

interface MarkButton { icon: IconName; label: (mod: string) => string; mark: number }
const MARK_BUTTONS: MarkButton[] = [
  { icon: 'bold', label: (mod) => `Pogrubienie (${mod}B)`, mark: MARK.bold },
  { icon: 'italic', label: (mod) => `Kursywa (${mod}I)`, mark: MARK.italic },
  { icon: 'underline', label: (mod) => `Podkreślenie (${mod}U)`, mark: MARK.underline },
  { icon: 'strike', label: () => 'Przekreślenie', mark: MARK.strike },
  { icon: 'palette', label: () => 'Kolor akcentu', mark: MARK.accent },
]
const ALIGN_BUTTONS: { icon: IconName; label: string; align: Align }[] = [
  { icon: 'alignLeft', label: 'Do lewej', align: 'left' },
  { icon: 'alignCenter', label: 'Do środka', align: 'center' },
  { icon: 'alignRight', label: 'Do prawej', align: 'right' },
]

// Sam widok paska (bez pozycjonowania i nasłuchu zaznaczenia). Przyciski nie
// zabierają fokusu polu (`preventDefault` na pointerdown), a strzałki
// przenoszą fokus między nimi (roving tabindex).
export function ToolbarButtons({ state, onFormat }: { state: ToolbarState; onFormat: (op: FormatOp) => void }): ReactElement {
  const mod = isMacPlatform() ? '⌘' : 'Ctrl+'
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent) => {
    const buttons = Array.from(rootRef.current?.querySelectorAll('button') ?? [])
    const current = buttons.findIndex((b) => b === document.activeElement)
    if (current === -1 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    const next = rovingTarget(event.key, current, buttons.map(() => true))
    if (next === null) return
    event.preventDefault()
    setActive(next)
    buttons[next]?.focus()
  }

  const props = (index: number) => ({
    tabIndex: index === active ? 0 : -1,
    onFocus: () => setActive(index),
    onPointerDown: (event: { preventDefault(): void }) => event.preventDefault(),
  })

  return (
    <div ref={rootRef} role="toolbar" aria-label="Formatowanie tekstu" className="flex items-center gap-0.5" onKeyDown={onKeyDown}>
      {MARK_BUTTONS.map((item, i) => (
        <IconButton
          key={item.icon}
          icon={item.icon}
          label={item.label(mod)}
          aria-pressed={(state.marks & item.mark) !== 0}
          onClick={() => onFormat({ kind: 'mark', mark: item.mark })}
          {...props(i)}
        />
      ))}
      <IconButton
        icon="clearFormat"
        label="Wyczyść formatowanie"
        onClick={() => onFormat({ kind: 'clear' })}
        {...props(MARK_BUTTONS.length)}
      />
      <span role="separator" aria-orientation="vertical" className="mx-1 h-5 w-px flex-none bg-border" />
      {ALIGN_BUTTONS.map((item, i) => (
        <IconButton
          key={item.align}
          icon={item.icon}
          label={item.label}
          aria-pressed={state.align === item.align}
          aria-disabled={state.alignable ? undefined : true}
          title={state.alignable ? item.label : ALIGN_UNAVAILABLE}
          className={state.alignable ? undefined : 'opacity-50'}
          onClick={() => {
            if (state.alignable) onFormat({ kind: 'align', align: item.align })
          }}
          {...props(MARK_BUTTONS.length + 1 + i)}
        />
      ))}
    </div>
  )
}

interface Shown { anchor: Box; state: ToolbarState }

interface SelectionSnapshot { anchorNode: Node | null; anchorOffset: number; focusNode: Node | null; focusOffset: number }

function snapshot(sel: Selection | null): SelectionSnapshot | null {
  if (!sel) return null
  return { anchorNode: sel.anchorNode, anchorOffset: sel.anchorOffset, focusNode: sel.focusNode, focusOffset: sel.focusOffset }
}

function sameSelection(a: SelectionSnapshot | null, b: SelectionSnapshot | null): boolean {
  return a !== null && b !== null && a.anchorNode === b.anchorNode && a.anchorOffset === b.anchorOffset
    && a.focusNode === b.focusNode && a.focusOffset === b.focusOffset
}

const toBox = (rect: DOMRect): Box => ({ top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right })

// Kotwica paska otwartego klawiaturą: zaznaczenie w polu, a gdy go nie widać
// (zwinięte, przerysowane po blur) - samo pole.
function anchorIn(el: HTMLElement): Box {
  const sel = document.getSelection()
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed && el.contains(sel.anchorNode)) {
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.width || rect.height) return toBox(rect)
  }
  return toBox(el.getBoundingClientRect())
}

// Pływający pasek nad zaznaczeniem w polu z formatowaniem (portal do body).
// Pokazuje się przy niepustym zaznaczeniu w jednym polu, które (lub pasek)
// ma fokus; chowa się przy zwinięciu zaznaczenia, utracie fokusu i Escape.
// Alt+F10 w polu pokazuje pasek (też bez zaznaczenia) z fokusem na pierwszym
// przycisku; Escape w pasku wraca do pola z jego zaznaczeniem, Tab wychodzi.
export function FormatToolbar(): ReactElement | null {
  const [shown, setShown] = useState<Shown | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<ReturnType<typeof richFieldFor>>(null)
  // Zaznaczenie, przy którym pasek schowano Escape - póki się nie zmieni, pasek nie wraca.
  const dismissed = useRef<SelectionSnapshot | null>(null)
  // Pole, dla którego pasek otwarto klawiaturą (Alt+F10), i czy dać fokus przyciskowi.
  const forced = useRef<HTMLElement | null>(null)
  const focusFirst = useRef(false)
  const refreshRef = useRef<() => void>(() => {})

  useEffect(() => {
    const hide = () => {
      fieldRef.current = null
      forced.current = null
      setShown(null)
    }
    const show = (field: NonNullable<ReturnType<typeof richFieldFor>>, anchor: Box) => {
      fieldRef.current = field
      setShown({ anchor, state: field.handle.state() })
    }
    const refresh = () => {
      const focus = document.activeElement
      const inPanel = !!focus && !!panelRef.current?.contains(focus)
      // Tryb klawiatury trwa, póki fokus jest w pasku (albo w polu tuż przed
      // przeniesieniem go na przycisk); powrót do pola to zwykły tryb.
      if (forced.current) {
        const field = richFieldFor(forced.current)
        const inField = !!field && !!focus && field.el.contains(focus) && focusFirst.current
        if (field && (inPanel || inField)) return show(field, anchorIn(field.el))
        forced.current = null
      }
      const sel = document.getSelection()
      if (dismissed.current || !sel || sel.rangeCount === 0 || sel.isCollapsed) return hide()
      const field = richFieldFor(sel.anchorNode)
      if (!field || richFieldFor(sel.focusNode)?.el !== field.el) return hide()
      if (!focus || !(field.el.contains(focus) || inPanel)) return hide()
      show(field, toBox(sel.getRangeAt(0).getBoundingClientRect()))
    }
    refreshRef.current = refresh
    const onSelection = () => {
      if (!sameSelection(dismissed.current, snapshot(document.getSelection()))) dismissed.current = null
      refresh()
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const onFocusOut = () => {
      clearTimeout(timer)
      timer = setTimeout(refresh, 0)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || !fieldRef.current) return
      event.stopPropagation()
      forced.current = null
      dismissed.current = snapshot(document.getSelection())
      refresh()
    }
    const stopRequests = listenToolbarRequests((el) => {
      forced.current = el
      focusFirst.current = true
      dismissed.current = null
      refresh()
    })
    document.addEventListener('selectionchange', onSelection)
    document.addEventListener('focusout', onFocusOut)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', refresh, true)
    window.addEventListener('resize', refresh)
    return () => {
      clearTimeout(timer)
      stopRequests()
      document.removeEventListener('selectionchange', onSelection)
      document.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
    }
  }, [])

  // Pozycja: nad zaznaczeniem, a bez miejsca pod nim; przycięta do okna.
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!shown || !panel) return
    const { width, height } = panel.getBoundingClientRect()
    const pos = placeToolbar(shown.anchor, { width, height }, { width: document.documentElement.clientWidth, height: window.innerHeight })
    panel.style.visibility = pos ? 'visible' : 'hidden'
    if (pos) {
      panel.style.top = `${pos.top}px`
      panel.style.left = `${pos.left}px`
    }
    // Otwarty klawiaturą: fokus na pierwszym przycisku (pole pamięta zaznaczenie).
    if (focusFirst.current) {
      focusFirst.current = false
      panel.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }, [shown])

  if (!shown) return null

  const onFormat = (op: FormatOp) => {
    const field = fieldRef.current
    if (!field) return
    field.handle.applyFormat(op)
    const sel = document.getSelection()
    const rect = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).getBoundingClientRect() : null
    setShown((prev) => {
      if (!prev) return prev
      const anchor = forced.current ? anchorIn(field.el) : rect && (rect.width || rect.height) ? toBox(rect) : prev.anchor
      return { anchor, state: field.handle.state() }
    })
  }

  // Escape w pasku: fokus i zaznaczenie wracają do pola, pasek się chowa
  // (i nie wraca, póki zaznaczenie się nie zmieni).
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    const field = fieldRef.current
    event.preventDefault()
    event.stopPropagation()
    forced.current = null
    field?.handle.focus()
    dismissed.current = snapshot(document.getSelection())
    refreshRef.current()
  }

  return createPortal(
    <div ref={panelRef} style={{ position: 'fixed', top: 0, left: 0 }} onMouseDown={(event) => event.preventDefault()}
      onKeyDown={onKeyDown}
      className="z-40 rounded-xl border border-border bg-surface p-1 shadow-pop"
    >
      <ToolbarButtons state={shown.state} onFormat={onFormat} />
    </div>,
    document.body,
  )
}
