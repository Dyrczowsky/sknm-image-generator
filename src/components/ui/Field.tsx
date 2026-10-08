import { useId } from 'react'
import type { ReactNode } from 'react'
import { UI_ERROR, UI_HINT, UI_LABEL } from '../styles'
import { FieldContext } from './fieldContext'
import { Icon } from './Icon'

interface FieldProps {
  label: ReactNode
  // Etykieta tylko dla czytników ekranu (pole w pasku narzędzi, wiersz listy).
  labelHidden?: boolean
  // Stała podpowiedź pod polem.
  hint?: ReactNode
  // Treść błędu; jej obecność oznacza pole jako błędne (`aria-invalid`).
  error?: ReactNode
  required?: boolean
  // Miejsce po prawej stronie etykiety, np. przełącznik widoczności pola.
  action?: ReactNode
  // Id kontrolki, gdy musi być znane z zewnątrz; domyślnie generowane.
  id?: string
  className?: string
  // Jedna kontrolka: Input / Textarea / Select (same biorą id z Field) albo
  // własna, która używa `useFieldControl`.
  children: ReactNode
}

// Etykieta + kontrolka + podpowiedź / błąd. Etykieta to prawdziwy
// `<label htmlFor>`, a podpowiedź i błąd są podpięte przez `aria-describedby`.
export function Field({ label, labelHidden = false, hint, error, required = false, action, id, className, children }: FieldProps) {
  const generated = useId()
  const controlId = id ?? `${generated}-control`
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex min-w-0 flex-col gap-1.5${className ? ` ${className}` : ''}`}>
      <div className={labelHidden && !action ? 'sr-only' : 'flex min-h-5 items-center justify-between gap-2'}>
        <label htmlFor={controlId} className={labelHidden ? 'sr-only' : UI_LABEL}>
          {label}
          {required && <span aria-hidden="true" className="text-danger"> *</span>}
        </label>
        {action && <span className="-my-2 flex flex-none items-center">{action}</span>}
      </div>
      <FieldContext.Provider value={{ id: controlId, describedBy, invalid: Boolean(error), required }}>
        {children}
      </FieldContext.Provider>
      {error && (
        <p id={errorId} className={UI_ERROR} role="alert">
          <Icon name="alert" className="mt-px" />
          <span>{error}</span>
        </p>
      )}
      {hint && <p id={hintId} className={UI_HINT}>{hint}</p>}
    </div>
  )
}
