import type { ApiError } from '../../src/api/types'
import { keyFrom, keyMatches } from './auth'
import type { Env } from './env'
import { generate } from './generate'
import templates from './templates.json'

const MAX_BODY_BYTES = 25 * 1024 * 1024

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

const errorResponse = (error: ApiError, status: number) => json(error, status)

function statusFor(code: ApiError['code']): number {
  if (code === 'render_unavailable') return 503
  if (code === 'render_failed' || code === 'storage_failed') return 500
  return 400
}

// Treść do 25 MB; sprawdza nagłówek i faktycznie odczytane bajty.
async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'))
  if (declared > MAX_BODY_BYTES) return null
  const reader = request.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > MAX_BODY_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const all = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) {
    all.set(c, offset)
    offset += c.length
  }
  return new TextDecoder().decode(all)
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (!keyMatches(keyFrom(request), env.SKNM_API_KEY)) {
      return errorResponse({ code: 'unauthorized', message: 'Brak lub nieprawidłowy klucz API.' }, 401)
    }
    const { success } = await env.RATE_LIMITER.limit({ key: 'global' })
    if (!success) return errorResponse({ code: 'rate_limited', message: 'Za dużo wywołań. Spróbuj ponownie za chwilę.' }, 429)

    const { pathname } = new URL(request.url)
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

    // `/mcp` i `/mcp/<klucz>` - obsługa w zadaniu 9.
    return notFound()
  },
}
