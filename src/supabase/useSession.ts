import { useEffect, useRef, useState } from 'react'
import { arrivedToSetPassword, supabase } from './client'

// `unconfigured` - build bez Supabase; `settingPassword` - użytkownik ma sesję
// z zaproszenia albo resetu hasła i powinien teraz ustawić hasło.
export type SessionStatus = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn' | 'settingPassword'

// Wynik akcji: komunikat błędu do pokazania w formularzu albo `null`.
export type AuthResult = { error: string | null }

const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Nieprawidłowy e-mail lub hasło.',
  'Email not confirmed': 'Adres e-mail nie został jeszcze potwierdzony.',
}

function toResult(error: { message: string } | null): AuthResult {
  return { error: error ? (MESSAGES[error.message] ?? error.message) : null }
}

// Sesja zalogowanego członka koła. Akcje nigdy nie rzucają - zwracają
// `AuthResult`.
export function useSession() {
  const [status, setStatus] = useState<SessionStatus>(supabase ? 'loading' : 'unconfigured')
  const [email, setEmail] = useState<string | null>(null)
  const passwordPending = useRef(arrivedToSetPassword)

  useEffect(() => {
    if (!supabase) return
    // Supabase od razu po subskrypcji zgłasza bieżącą sesję (INITIAL_SESSION).
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') passwordPending.current = true
      setEmail(session?.user.email ?? null)
      if (!session) setStatus('signedOut')
      else setStatus(passwordPending.current ? 'settingPassword' : 'signedIn')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const finishPasswordSetup = () => {
    passwordPending.current = false
    setStatus('signedIn')
  }

  const signIn = async (signInEmail: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Logowanie nie jest skonfigurowane.' }
    return toResult((await supabase.auth.signInWithPassword({ email: signInEmail, password })).error)
  }

  const signOut = async (): Promise<AuthResult> => {
    if (!supabase) return { error: null }
    return toResult((await supabase.auth.signOut()).error)
  }

  // Wysyła link, po którym użytkownik wraca do aplikacji i ustawia nowe hasło.
  const requestPasswordReset = async (resetEmail: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Logowanie nie jest skonfigurowane.' }
    const redirectTo = window.location.origin + import.meta.env.BASE_URL
    return toResult((await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo })).error)
  }

  const setPassword = async (password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Logowanie nie jest skonfigurowane.' }
    const result = toResult((await supabase.auth.updateUser({ password })).error)
    if (!result.error) finishPasswordSetup()
    return result
  }

  return { status, email, signIn, signOut, requestPasswordReset, setPassword, skipPasswordSetup: finishPasswordSetup }
}

export type Session = ReturnType<typeof useSession>
