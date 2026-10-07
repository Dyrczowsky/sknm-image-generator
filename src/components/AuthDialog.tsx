import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { AuthResult, Session } from '../supabase/useSession'
import { BUTTON_GHOST, BUTTON_PRIMARY, DIALOG, DIALOG_FIELD, DIALOG_LABEL } from './styles'

const TITLE_ID = 'auth-dialog-title'
const MIN_PASSWORD_LENGTH = 8

interface AuthFormProps {
  title: string
  submitLabel: string
  onSubmit: () => Promise<AuthResult>
  // Wołane po sukcesie, gdy formularz nie ma `successMessage`.
  onDone?: () => void
  onCancel: () => void
  cancelLabel?: string
  // Komunikat pokazywany po sukcesie zamiast zamykania modala.
  successMessage?: string
  children: ReactNode
  footer?: ReactNode
}

// Wspólna rama formularzy logowania: tytuł, pola, błąd z Supabase, przyciski.
function AuthForm({ title, submitLabel, onSubmit, onDone, onCancel, cancelLabel = 'Anuluj', successMessage, children, footer }: AuthFormProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await onSubmit()
    setBusy(false)
    if (result.error) setError(result.error)
    else if (successMessage) setSucceeded(true)
    else onDone?.()
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
      <h2 id={TITLE_ID} className="text-lg font-semibold">{title}</h2>
      {succeeded ? <p className="text-[0.9rem]" role="status">{successMessage}</p> : children}
      {error && <p className="text-[0.85rem] text-danger" role="alert">{error}</p>}
      <div className="mt-1 flex items-center justify-end gap-2">
        {!succeeded && footer}
        <button type="button" className={BUTTON_GHOST} onClick={onCancel}>{succeeded ? 'Zamknij' : cancelLabel}</button>
        {!succeeded && <button type="submit" className={BUTTON_PRIMARY} disabled={busy}>{submitLabel}</button>}
      </div>
    </form>
  )
}

interface FieldProps {
  id: string
  label: string
  type: 'email' | 'password'
  autoComplete: string
  value: string
  onChange: (value: string) => void
  minLength?: number
}

function Field({ id, label, onChange, ...input }: FieldProps) {
  return (
    <div>
      <label className={DIALOG_LABEL} htmlFor={id}>{label}</label>
      <input id={id} required className={DIALOG_FIELD} onChange={(e) => onChange(e.target.value)} {...input} />
    </div>
  )
}

function SignInForm({ session, onClose }: { session: Session; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  if (resetting) {
    return (
      <AuthForm
        title="Nie pamiętam hasła"
        submitLabel="Wyślij link"
        onSubmit={() => session.requestPasswordReset(email)}
        onCancel={onClose}
        successMessage="Jeśli konto istnieje, wysłaliśmy na ten adres link do ustawienia nowego hasła."
      >
        <Field id="auth-reset-email" label="E-mail" type="email" autoComplete="email" value={email} onChange={setEmail} />
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title="Zaloguj się"
      submitLabel="Zaloguj"
      onSubmit={() => session.signIn(email, password)}
      onDone={onClose}
      onCancel={onClose}
      footer={
        <button type="button" className="mr-auto cursor-pointer text-[0.8rem] text-muted underline hover:text-fg" onClick={() => setResetting(true)}>
          Nie pamiętam hasła
        </button>
      }
    >
      <p className="text-[0.85rem] text-muted">Konta zakłada zarząd koła — logowanie odblokowuje wspólną historię i notatki.</p>
      <Field id="auth-email" label="E-mail" type="email" autoComplete="email" value={email} onChange={setEmail} />
      <Field id="auth-password" label="Hasło" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
    </AuthForm>
  )
}

// Po wejściu z zaproszenia albo z linku resetu: użytkownik ma sesję i ustawia hasło.
function SetPasswordForm({ session }: { session: Session }) {
  const [password, setPassword] = useState('')
  return (
    <AuthForm
      title="Ustaw hasło"
      submitLabel="Zapisz hasło"
      onSubmit={() => session.setPassword(password)}
      onCancel={session.skipPasswordSetup}
      cancelLabel="Później"
    >
      <p className="text-[0.85rem] text-muted">Zalogowano jako {session.email}. Ustaw hasło, którym będziesz się logować.</p>
      <Field
        id="auth-new-password"
        label={`Nowe hasło (min. ${MIN_PASSWORD_LENGTH} znaków)`}
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        value={password}
        onChange={setPassword}
      />
    </AuthForm>
  )
}

interface AuthDialogProps {
  session: Session
  // Czy użytkownik poprosił o okno logowania. Ustawianie hasła otwiera modal samo.
  open: boolean
  onClose: () => void
}

// Modal logowania na natywnym <dialog>, jak TicketDialog: formularze montują
// się przy otwarciu i odmontowują przy zamknięciu, więc ich stan się resetuje.
export function AuthDialog({ session, open, onClose }: AuthDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const settingPassword = session.status === 'settingPassword'
  const signingIn = open && session.status === 'signedOut'
  const shown = settingPassword || signingIn

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (shown && !el.open) el.showModal()
    else if (!shown && el.open) el.close()
  }, [shown])

  const handleClose = () => {
    if (settingPassword) session.skipPasswordSetup()
    onClose()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={TITLE_ID}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === ref.current) handleClose()
      }}
      className={`${DIALOG} max-w-[420px]`}
    >
      <div className="p-5">
        {settingPassword && <SetPasswordForm session={session} />}
        {signingIn && <SignInForm session={session} onClose={onClose} />}
      </div>
    </dialog>
  )
}
