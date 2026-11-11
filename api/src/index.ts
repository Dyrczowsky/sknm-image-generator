import { OAuthProvider } from '@cloudflare/workers-oauth-provider'
import type { ApiError } from '../../src/api/types'
import { readBody } from './body'
import { authenticate, keyFrom, type Owner } from './auth'
import type { Env } from './env'
import { generate } from './generate'
import { handleMcp, RATE_LIMITED_MESSAGE } from './mcp'
import { authorize } from './oauth'
import { supabase } from './supabase'
import templates from './templates.json'

// Publiczny adres Workera: OAuth wiąże z nim tokeny (resource) i wystawcę (issuer).
// shortcut: stały adres workers.dev; po podpięciu własnej domeny zmienić tutaj.
const ORIGIN = 'https://sknm-api.dyrczkuba.workers.dev'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

const errorResponse = (error: ApiError, status: number) => json(error, status)

const storageDown = (e: unknown, what: string) => {
  console.error(`${what}:`, e instanceof Error ? e.message : 'nieznany błąd')
  return errorResponse({ code: 'storage_failed', message: 'Nie udało się sprawdzić uprawnień. Spróbuj ponownie za chwilę.' }, 503)
}

function statusFor(code: ApiError['code']): number {
  if (code === 'render_unavailable') return 503
  if (code === 'render_failed' || code === 'storage_failed') return 500
  return 400
}

// Klucz API `sknm_…` w nagłówku Bearer: REST i MCP jak dotąd. Bez klucza: 401.
async function withApiKey(request: Request, env: Env): Promise<Response> {
  let owner: Owner | null
  try {
    owner = await authenticate(request, env)
  } catch (e) {
    return storageDown(e, 'auth: sprawdzenie klucza nie powiodło się')
  }
  if (!owner) {
    return errorResponse({ code: 'unauthorized', message: 'Brak lub nieprawidłowy klucz API (nagłówek Authorization: Bearer <klucz>).' }, 401)
  }
  const { pathname } = new URL(request.url)
  const wrongMethod = () => errorResponse({ code: 'bad_request', message: 'Niedozwolona metoda.' }, 405)

  if (pathname === '/api/templates') return request.method === 'GET' ? json(templates) : wrongMethod()

  if (pathname === '/api/render') {
    if (request.method !== 'POST') return wrongMethod()
    // Limit (osobny dla każdego klucza) dotyczy tylko generowania obrazów, nie katalogu ani MCP initialize/tools/list.
    const { success } = await env.RATE_LIMITER.limit({ key: owner.id })
    if (!success) return errorResponse({ code: 'rate_limited', message: RATE_LIMITED_MESSAGE }, 429)
    const text = await readBody(request)
    if (text === null) return errorResponse({ code: 'bad_request', message: 'Treść żądania jest większa niż 25 MB.' }, 413)
    let args: unknown
    try {
      args = JSON.parse(text)
    } catch {
      return errorResponse({ code: 'bad_request', message: 'Treść żądania nie jest poprawnym JSON.' }, 400)
    }
    const result = await generate(env, owner, args)
    if (!result.ok) return errorResponse(result.error, statusFor(result.error.code))
    const { url, width, height, historyId, png } = result.value
    // Bez zapisu nie ma adresu, więc obraz idzie w odpowiedzi.
    return json(url === null ? { width, height, png } : { url, width, height, historyId })
  }

  if (pathname === '/mcp') return handleMcp(request, env, owner)

  return errorResponse({ code: 'bad_request', message: 'Nie znaleziono.' }, 404)
}

// MCP z tokenem OAuth: token nie wygasa razem z członkostwem, więc sprawdzamy je przy każdym wywołaniu.
async function mcpWithToken(request: Request, env: Env, owner: Owner): Promise<Response> {
  let member: boolean
  try {
    member = await supabase(env).isMember(owner.id)
  } catch (e) {
    return storageDown(e, 'oauth: sprawdzenie członkostwa nie powiodło się')
  }
  if (!member) return errorResponse({ code: 'unauthorized', message: 'To konto nie należy już do zespołu SKNM.' }, 403)
  return handleMcp(request, env, owner)
}

export const oauthProvider = new OAuthProvider<Env>({
  apiRoute: '/mcp',
  apiHandler: { fetch: (request, env, ctx) => mcpWithToken(request, env, (ctx as ExecutionContext & { props: Owner }).props) },
  defaultHandler: {
    fetch: (request, env) => (new URL(request.url).pathname === '/authorize' ? authorize(request, env) : withApiKey(request, env)),
  },
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/oauth/token',
  clientRegistrationEndpoint: '/oauth/register',
  clientIdMetadataDocumentEnabled: true,
  scopesSupported: ['mcp'],
  requiredScopes: ['mcp'],
  resourceMetadata: { resource: `${ORIGIN}/mcp`, authorization_servers: [ORIGIN] },
})

export default {
  // Klucz `sknm_…` omija OAuth (REST, Claude Code z nagłówkiem); reszta, w tym connectory z claude.ai, idzie przez OAuth.
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return keyFrom(request) ? withApiKey(request, env) : oauthProvider.fetch(request, env, ctx)
  },
}
