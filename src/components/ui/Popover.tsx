import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent, ReactNode, RefObject } from 'react'
import { POPOVER_PANEL } from '../styles'

// Propsy, które `Popover` daje przyciskowi otwierającemu - rozlej je na
// `Button` / `IconButton`: `trigger={(props) => <IconButton {...props} icon="help" label="Pomoc" />}`.
export interface PopoverTriggerProps {
  ref: RefObject<HTMLButtonElement | null>
  'aria-haspopup': 'dialog' | 'menu'
  'aria-expanded': boolean
  'aria-controls': string | undefined
  onClick: () => void
}

interface PopoverProps {
  trigger: (props: PopoverTriggerProps) => ReactNode
  // Nazwa panelu dla czytników ekranu.
  label: string
  // Treść; funkcja dostaje `close` (zamyka i oddaje fokus przyciskowi) -
  // przydatne w pozycjach menu.
  children: ReactNode | ((close: () => void) => ReactNode)
  // Która krawędź panelu trzyma się przycisku (start = lewa, end = prawa).
  align?: 'start' | 'end'
  side?: 'bottom' | 'top'
  // `dialog` - dowolna treść (pomoc, formularz); `menu` - lista akcji.
  role?: 'dialog' | 'menu'
  // Sterowanie z zewnątrz (np. skrót klawiszowy); bez tych propsów stan trzyma komponent.
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // Treść zostaje w drzewie także po zamknięciu (ukryta przez `hidden`).
  keepMounted?: boolean
  // Klasy panelu, np. szerokość (`w-72`).
  className?: string
}

const VIEWPORT_MARGIN = 8

// Panel przypięty do przycisku: menu, pomoc, wybór z listy. Otwiera się
// kliknięciem; zamyka Escape (fokus wraca na przycisk), kliknięcie poza nim
// i wyjście fokusem. Bez portalu - panel jest pozycjonowany względem
// opakowania i dosuwany do krawędzi okna, gdy by wystawał.
export function Popover({
  trigger, label, children, align = 'start', side = 'bottom', role = 'dialog',
  open: controlledOpen, onOpenChange, keepMounted = false, className,
}: PopoverProps) {
  const panelId = useId()
  const [innerOpen, setInnerOpen] = useState(false)
  const open = controlledOpen ?? innerOpen
  const [shift, setShift] = useState(0)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const setOpen = useCallback((next: boolean) => {
    if (controlledOpen === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }, [controlledOpen, onOpenChange])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [setOpen])

  // Po otwarciu: dosuń panel do okna i przenieś do niego fokus.
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!open || !panel) return
    const rect = panel.getBoundingClientRect()
    const left = rect.left - shift
    const right = rect.right - shift
    const viewport = document.documentElement.clientWidth
    let next = 0
    if (right > viewport - VIEWPORT_MARGIN) next = viewport - VIEWPORT_MARGIN - right
    if (left + next < VIEWPORT_MARGIN) next = VIEWPORT_MARGIN - left
    if (next !== shift) setShift(next)
    if (!panel.contains(document.activeElement)) panel.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pomiar tylko przy otwarciu
  }, [open])

  // Kliknięcie poza panelem i przyciskiem zamyka (fokus zostaje tam, gdzie kliknięto).
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && wrapperRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, setOpen])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return
    event.stopPropagation()
    close()
  }

  // Tab poza panel zamyka go bez ściągania fokusu z powrotem.
  const onBlur = (event: FocusEvent) => {
    if (!open || !(event.relatedTarget instanceof Node)) return
    if (!wrapperRef.current?.contains(event.relatedTarget)) setOpen(false)
  }

  const mounted = open || keepMounted
  const position = `${side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'} ${align === 'start' ? 'left-0' : 'right-0'}`

  return (
    <span ref={wrapperRef} className="relative inline-flex" onKeyDown={onKeyDown} onBlur={onBlur}>
      {trigger({
        ref: triggerRef,
        'aria-haspopup': role,
        'aria-expanded': open,
        'aria-controls': mounted ? panelId : undefined,
        onClick: () => setOpen(!open),
      })}
      {mounted && (
        <div
          ref={panelRef}
          id={panelId}
          role={role}
          aria-label={label}
          tabIndex={-1}
          hidden={!open}
          style={shift ? { transform: `translateX(${shift}px)` } : undefined}
          className={`absolute z-30 w-max max-w-[calc(100vw-1rem)] outline-none ${position} ${POPOVER_PANEL}${className ? ` ${className}` : ''}`}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </span>
  )
}
