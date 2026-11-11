import type { ApiError } from '../../src/api/types'
import { readBody } from './body'
import { authenticate, type Owner } from './auth'
import type { Env } from './env'
import { generate } from './generate'
import { handleMcp, RATE_LIMITED_MESSAGE } from './mcp'
import templates from './templates.json'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

const errorResponse = (error: ApiError, status: number) => json(error, status)

function statusFor(code: ApiError['code']): number {
  if (code === 'render_unavailable') return 503
  if (code === 'render_failed' || code === 'storage_failed') return 500
  return 400
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url)
    // Klienci MCP sprawdzają te adresy; 404 znaczy "bez OAuth" (klucz idzie w nagłówku).
    if (pathname.startsWith('/.well-known/oauth-')) {
      return errorResponse({ code: 'bad_request', message: 'Nie znaleziono.' }, 404)
    }
    let owner: Owner | null
    try {
      owner = await authenticate(request, env)
    } catch (e) {
      console.error('auth: sprawdzenie klucza nie powiodło się:', e instanceof Error ? e.message : 'nieznany błąd')
      return errorResponse({ code: 'storage_failed', message: 'Nie udało się sprawdzić klucza. Spróbuj ponownie za chwilę.' }, 503)
    }
    if (!owner) {
      return errorResponse({ code: 'unauthorized', message: 'Brak lub nieprawidłowy klucz API (nagłówek Authorization: Bearer <klucz>).' }, 401)
    }
    const notFound = () => errorResponse({ code: 'bad_request', message: 'Nie znaleziono.' }, 404)
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

    return notFound()
  },
}
