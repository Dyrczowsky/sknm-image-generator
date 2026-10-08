import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { buttonClass } from '../styles'
import type { ButtonVariant, ControlSize } from '../styles'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  // primary - jedna główna akcja widoku (Pobierz); outline - zwykła akcja;
  // ghost - akcja w pasku narzędzi lub poboczna; danger - akcja niszcząca
  // (do usuwania użyj raczej ConfirmButton).
  variant?: ButtonVariant
  size?: ControlSize
  // Ikona przed tekstem / za tekstem (np. `chevronDown` przy menu).
  icon?: IconName
  iconEnd?: IconName
  // Trwa akcja: kręciołek zamiast ikony, `aria-busy`, kliknięcia są pomijane.
  // Przycisk zostaje w kolejce fokusu (nie dostaje `disabled`), więc fokus
  // klawiatury nie ucieka w trakcie zapisu.
  busy?: boolean
  // Tekst na czas `busy` (np. „Generowanie…"); domyślnie zostaje zwykły.
  busyLabel?: string
  fullWidth?: boolean
  // `start` wyrównuje treść do lewej - pozycje menu w Popover.
  align?: 'center' | 'start'
  children: ReactNode
}

export function Button({
  variant = 'outline', size = 'sm', icon, iconEnd, busy = false, busyLabel, fullWidth = false, align = 'center',
  type = 'button', className, onClick, children, ...rest
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }
  const classes = buttonClass({ variant, size, fullWidth, align })
  return (
    <button
      type={type}
      className={className ? `${classes} ${className}` : classes}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      onClick={handleClick}
      {...rest}
    >
      {busy ? <Icon name="spinner" className="animate-spin" /> : icon && <Icon name={icon} />}
      {busy && busyLabel ? busyLabel : children}
      {iconEnd && <Icon name={iconEnd} />}
    </button>
  )
}
