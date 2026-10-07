import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent, ReactNode } from 'react'
import type { ButtonVariant, ControlSize } from '../styles'
import { Button } from './Button'
import type { IconName } from './Icon'

interface ConfirmButtonProps {
  // Podpis przycisku w spoczynku, np. „Usuń".
  children: ReactNode
  // Pytanie pokazywane po pierwszym kliknięciu - niech mówi, co zniknie
  // i komu („Usunąć wpis dla całego zespołu?").
  question: string
  // Podpis przycisku, który naprawdę wykonuje akcję.
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  icon?: IconName
  variant?: ButtonVariant
  size?: ControlSize
  busy?: boolean
  disabled?: boolean
  className?: string
}

// Zabezpieczenie przed podwójnym kliknięciem: potwierdzenie pojawia się
// w miejscu przycisku, więc drugie kliknięcie tuż po pierwszym jest pomijane.
const DOUBLE_CLICK_GUARD_MS = 400

// Akcja niszcząca z pytaniem w miejscu przycisku (zamiast `window.confirm`):
// pierwsze kliknięcie pokazuje pytanie z „Anuluj" i potwierdzeniem, dopiero
// drugie wykonuje akcję. Fokus trafia na „Anuluj"; Escape i wyjście fokusem
// wycofują pytanie.
export function ConfirmButton({
  children, question, confirmLabel = 'Tak, usuń', cancelLabel = 'Anuluj', onConfirm,
  icon, variant = 'danger', size = 'sm', busy = false, disabled = false, className,
}: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false)
  const askedAt = useRef(0)
  const restoreFocus = useRef(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (asking) {
      cancelRef.current?.focus()
    } else if (restoreFocus.current) {
      restoreFocus.current = false
      triggerRef.current?.focus()
    }
  }, [asking])

  const ask = () => {
    askedAt.current = Date.now()
    setAsking(true)
  }
  const cancel = (refocus: boolean) => {
    restoreFocus.current = refocus
    setAsking(false)
  }
  const confirm = () => {
    if (Date.now() - askedAt.current < DOUBLE_CLICK_GUARD_MS) return
    cancel(true)
    onConfirm()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    cancel(true)
  }
  const onBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) cancel(false)
  }

  if (!asking) {
    return (
      <Button ref={triggerRef} variant={variant} size={size} icon={icon} busy={busy} disabled={disabled} className={className} onClick={ask}>
        {children}
      </Button>
    )
  }
  return (
    <span
      role="group"
      aria-label={question}
      className={`inline-flex flex-wrap items-center gap-2${className ? ` ${className}` : ''}`}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <span className="text-[0.8125rem] font-semibold text-fg">{question}</span>
      <Button ref={cancelRef} variant="ghost" size={size} onClick={() => cancel(true)}>
        {cancelLabel}
      </Button>
      <Button variant="dangerSolid" size={size} icon={icon} onClick={confirm}>
        {confirmLabel}
      </Button>
    </span>
  )
}
