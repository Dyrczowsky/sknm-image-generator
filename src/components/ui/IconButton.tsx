import type { ComponentProps, MouseEvent } from 'react'
import { buttonClass } from '../styles'
import type { ButtonVariant, ControlSize } from '../styles'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'> {
  icon: IconName
  // Nazwa dla czytników ekranu i dymek po najechaniu - obowiązkowa, bo
  // przycisk nie ma tekstu.
  label: string
  variant?: ButtonVariant
  size?: ControlSize
  busy?: boolean
}

// Przycisk z samą ikoną. Dla przełącznika podaj `aria-pressed` i zmieniaj
// ikonę razem ze stanem (np. `eye` / `eyeOff`) - sam kolor to za mało.
export function IconButton({
  icon, label, variant = 'ghost', size = 'sm', busy = false, type = 'button', className, onClick, title, ...rest
}: IconButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }
  const classes = buttonClass({ variant, size, iconOnly: true })
  return (
    <button
      type={type}
      className={className ? `${classes} ${className}` : classes}
      aria-label={label}
      title={title ?? label}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      onClick={handleClick}
      {...rest}
    >
      {busy ? <Icon name="spinner" size="md" className="animate-spin" /> : <Icon name={icon} size="md" />}
    </button>
  )
}
