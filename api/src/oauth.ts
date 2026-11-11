import { AuthorizationError, CimdFetchError, type ConsentDescription } from '@cloudflare/workers-oauth-provider'
import type { Env } from './env'
import { supabase } from './supabase'

// Strona /authorize dla connectorów MCP (claude.ai, Claude Code): logowanie kontem
// SKNM i zgoda w jednym formularzu. Token dostaje tylko członek zespołu.

const escape = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const STYLE = `body{font:16px/1.5 system-ui,sans-serif;max-width:26rem;margin:3rem auto;padding:0 1rem;color:#1b1f3b;background:#fff}
h1{font-size:1.25rem}label{display:block;margin:.75rem 0 .25rem;font-size:.875rem}
input{width:100%;box-sizing:border-box;padding:.5rem;font:inherit;border:1px solid #c5c8d6;border-radius:6px}
.row{display:flex;gap:.5rem;margin-top:1.25rem}button{flex:1;padding:.6rem;font:inherit;border-radius:6px;border:1px solid #2e3a8c;cursor:pointer}
.ok{background:#2e3a8c;color:#fff}.no{background:#fff;color:#2e3a8c}.warn{background:#fff4d6;padding:.5rem .75rem;border-radius:6px}
.muted{color:#5b6075;font-size:.875rem}`

const shell = (title: string, body: string) =>
  `<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${STYLE}</style><body>${body}</body></html>`

export function consentPage(d: ConsentDescription, handle: string): string {
  const name = escape(d.clientName)
  const origin = d.clientDomain
    ? `Aplikację publikuje <strong>${escape(d.clientDomain)}</strong>.`
    : 'Aplikacja zarejestrowała się sama; jej nazwa nie jest potwierdzona.'
  return shell('Generator SKNM: zgoda', `
<h1>${name} chce tworzyć grafiki w generatorze SKNM w Twoim imieniu</h1>
<p class="muted">${origin} Dostęp trafi do <strong>${escape(d.redirectHost)}</strong>.</p>
${d.redirectIsLoopback ? '<p class="warn">Dostęp trafi do aplikacji na tym komputerze. Kontynuuj tylko, jeśli to Ty przed chwilą zacząłeś logowanie.</p>' : ''}
<form method="post">
<input type="hidden" name="handle" value="${escape(handle)}">
<label for="email">E-mail (konto generatora SKNM)</label><input id="email" name="email" type="email" autocomplete="username" required>
<label for="password">Hasło</label><input id="password" name="password" type="password" autocomplete="current-password" required>
<div class="row"><button class="no" name="decision" value="deny" formnovalidate>Odmów</button><button class="ok" name="decision" value="approve">Zaloguj i zezwól</button></div>
</form>
<p class="muted">Grafiki trafią do historii generatora pod Twoim nazwiskiem. Dostęp odbierzesz, usuwając connector.</p>`)
}

const message = (status: number, text: string) =>
  new Response(shell('Generator SKNM', `<h1>Generator SKNM</h1><p>${escape(text)}</p>`), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "frame-ancestors 'none'" },
  })

export async function authorize(request: Request, env: Env, sb: typeof supabase = supabase): Promise<Response> {
  const oauth = env.OAUTH_PROVIDER
  try {
    if (request.method === 'GET') {
      const authRequest = await oauth.parseAuthRequest(request)
      const details = await oauth.describeConsent(authRequest)
      const consent = await oauth.beginConsent(authRequest)
      consent.headers.set('Content-Type', 'text/html; charset=utf-8')
      return new Response(consentPage(details, consent.handle), { headers: consent.headers })
    }
    if (request.method !== 'POST') return message(405, 'Niedozwolona metoda.')

    const form = await request.formData()
    const handle = String(form.get('handle') ?? '')
    if (form.get('decision') !== 'approve') {
      const denied = await oauth.denyConsent(request, handle)
      denied.headers.set('Location', denied.redirectTo)
      return new Response(null, { status: 302, headers: denied.headers })
    }

    // Formularz zostaje ważny (handle zużywa dopiero approveConsent), więc po błędzie wystarczy wrócić.
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const password = String(form.get('password') ?? '')
    const { success } = await env.RATE_LIMITER.limit({ key: `login:${email}` })
    if (!success) return message(429, 'Za dużo prób logowania. Spróbuj ponownie za minutę.')
    const user = await sb(env).signIn(email, password)
    if (!user) return message(401, 'Nieprawidłowy e-mail lub hasło. Wróć do poprzedniej strony i spróbuj ponownie.')
    if (!(await sb(env).isMember(user.id))) return message(403, 'To konto nie należy do zespołu SKNM, więc nie może korzystać z generatora przez AI.')

    const approved = await oauth.approveConsent(request, handle)
    const { redirectTo } = await oauth.completeAuthorization({
      request: approved.request,
      userId: user.id,
      metadata: { email: user.email },
      scope: approved.request.scope,
      props: user,
    })
    approved.headers.set('Location', redirectTo)
    return new Response(null, { status: 302, headers: approved.headers })
  } catch (error) {
    if (error instanceof AuthorizationError && error.redirectTo) return Response.redirect(error.redirectTo, 302)
    if (error instanceof AuthorizationError) return message(400, `Nie udało się dokończyć logowania (${error.description}). Zacznij jeszcze raz z aplikacji.`)
    if (error instanceof CimdFetchError) return message(400, 'Nie udało się zweryfikować aplikacji, która prosi o dostęp.')
    throw error
  }
}
