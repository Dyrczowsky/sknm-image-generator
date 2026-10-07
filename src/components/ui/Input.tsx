import type { ComponentProps } from 'react'
import { fieldClass } from '../styles'
import type { ControlSize } from '../styles'
import { useFieldControl } from './fieldContext'
import { Icon } from './Icon'

// Trzy kontrolki o jednym wyglądzie. W środku `Field` same biorą `id`,
// `aria-describedby` i `aria-invalid`; poza `Field` podaj `aria-label`.
// `size` to rozmiar kontrolki (sm / md), nie natywny atrybut HTML.
// Szerokość: w `Field` kontrolka wypełnia go sama; poza nim ma szerokość
// naturalną - podaj ją w `className` (`w-full`, `flex-1`, `w-44`).

const join = (base: string, extra: string | undefined) => (extra ? `${base} ${extra}` : base)

export interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
  size?: ControlSize
}

export function Input({ size = 'md', className, type = 'text', ...rest }: InputProps) {
  const control = useFieldControl(rest)
  return <input type={type} className={join(fieldClass('input', size), className)} {...control} />
}

export interface TextareaProps extends ComponentProps<'textarea'> {
  size?: ControlSize
}

export function Textarea({ size = 'md', className, rows = 4, ...rest }: TextareaProps) {
  const control = useFieldControl(rest)
  return <textarea rows={rows} className={join(fieldClass('textarea', size), className)} {...control} />
}

export interface SelectProps extends Omit<ComponentProps<'select'>, 'size'> {
  size?: ControlSize
}

// Natywny `<select>` (klawiatura i telefon działają bez naszego kodu) z własną
// strzałką. `className` trafia na opakowanie (tam ustawiasz szerokość).
export function Select({ size = 'md', className, children, ...rest }: SelectProps) {
  const control = useFieldControl(rest)
  return (
    <span className={join('relative inline-flex min-w-0 items-center', className)}>
      <select className={fieldClass('select', size)} {...control}>
        {children}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-2.5 text-muted" />
    </span>
  )
}
