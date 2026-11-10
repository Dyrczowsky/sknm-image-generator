import type { ApiError } from '../../src/api/types'
import { readBody } from './body'
import { keyFrom, keyMatches } from './auth'
import type { Env } from './env'
import { generate } from './generate'
import { handleMcp } from './mcp'
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
    // claude.ai sprawdza te adresy; 404 znaczy "bez OAuth" (klucz idzie w ścieżce lub nagłówku).
    if (pathname.startsWith('/.well-known/oauth-')) {
      return errorResponse({ code: 'bad_request', message: 'Nie znaleziono.' }, 404)
    }
    if (!keyMatches(keyFrom(request), env.SKNM_API_KEY)) {
      return errorResponse({ code: 'unauthorized', message: 'Brak lub nieprawidłowy klucz API.' }, 401)
    }
    const { success } = await env.RATE_LIMITER.limit({ key: 'global' })
    if (!success) return errorResponse({ code: 'rate_limited', message: 'Za dużo wywołań. Spróbuj ponownie za chwilę.' }, 429)

    const notFound = () => errorResponse({ code: 'bad_request', message: 'Nie znaleziono.' }, 404)
    const wrongMethod = () => errorResponse({ code: 'bad_request', message: 'Niedozwolona metoda.' }, 405)

    if (pathname === '/api/templates') return request.method === 'GET' ? json(templates) : wrongMethod()

    if (pathname === '/api/render') {
      if (request.method !== 'POST') return wrongMethod()
      const text = await readBody(request)
      if (text === null) return errorResponse({ code: 'bad_request', message: 'Treść żądania jest większa niż 25 MB.' }, 413)
      let args: unknown
      try {
        args = JSON.parse(text)
      } catch {
        return errorResponse({ code: 'bad_request', message: 'Treść żądania nie jest poprawnym JSON.' }, 400)
      }
      const result = await generate(env, args)
      if (!result.ok) return errorResponse(result.error, statusFor(result.error.code))
      const { url, width, height, historyId } = result.value
      return json({ url, width, height, historyId })
    }

    if (pathname === '/mcp' || /^\/mcp\/[^/]+\/?$/.test(pathname)) return handleMcp(request, env)

    return notFound()
  },
}
