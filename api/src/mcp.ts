import { readBody } from './body'
import type { Env } from './env'
import { generate } from './generate'
import templates from './templates.json'

// Bezstanowy MCP (Streamable HTTP) z odpowiedziami JSON, bez SSE.
const PROTOCOLS = ['2025-06-18', '2025-03-26']

type Id = string | number | null
interface RpcRequest { jsonrpc: '2.0'; id?: Id; method: string; params?: unknown }

const tools = [
  {
    name: 'list_templates',
    description: 'Zwraca katalog szablonów grafik SKNM: klucze, pola, schematy kolorów, zdjęcia i opcje. Wywołaj to przed generate_image.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'generate_image',
    description: [
      'Tworzy grafikę (PNG) do posta na Facebooku w stylu SKNM i zapisuje ją w historii.',
      'Najpierw wywołaj list_templates i wybierz szablon oraz pola, które do niego pasują.',
      'Kształt "story" wybieraj tylko, gdy użytkownik prosi o Story lub relację; w pozostałych przypadkach użyj "square".',
      'Zdjęcia podawaj jako "url"; "data" (base64) tylko wtedy, gdy nie ma adresu URL.',
      'Pola są zwykłym tekstem; nową linię zapisuj jako \\n.',
      'Tekst do plakatu napisz sam na podstawie prośby użytkownika.',
    ].join(' '),
    inputSchema: {
      type: 'object',
      required: ['template'],
      properties: {
        template: { type: 'string', description: 'Klucz szablonu z list_templates.' },
        shape: { type: 'string', enum: ['square', 'story'], description: 'square 1080x1080 (domyślnie) lub story 1080x1920.' },
        scheme: { type: 'string', description: 'Nazwa schematu kolorów z list_templates (domyślnie pierwszy).' },
        lang: { type: 'string', enum: ['pl', 'en'] },
        fields: {
          type: 'object',
          description: 'Pola tekstowe szablonu (nazwy z list_templates), każde do 2000 znaków.',
          properties: Object.fromEntries(
            [...new Set(templates.templates.flatMap((t) => t.fields.map((f) => f.name)))].map((k) => [k, { type: 'string' }]),
          ),
          additionalProperties: false,
        },
        photos: {
          type: 'object',
          properties: {
            photo: {
              type: 'array',
              maxItems: 6,
              description: 'Zdjęcia JPEG/PNG do 5 MB każde. Podaj "url" albo "data".',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'Adres https zdjęcia (preferowany).' },
                  data: { type: 'string', description: 'Zdjęcie w base64 (tylko bez URL).' },
                  x: { type: 'number', minimum: 0, maximum: 100, description: 'Przesunięcie poziome kadru, 0-100 (domyślnie 50).' },
                  y: { type: 'number', minimum: 0, maximum: 100, description: 'Przesunięcie pionowe kadru, 0-100 (domyślnie 50).' },
                  zoom: { type: 'number', minimum: 1, description: 'Powiększenie kadru, minimum 1 (domyślnie 1).' },
                },
              },
            },
          },
        },
        lists: {
          type: 'object',
          properties: {
            agenda: {
              type: 'array',
              maxItems: 20,
              items: {
                type: 'object',
                properties: { time: { type: 'string' }, title: { type: 'string' }, subtitle: { type: 'string' } },
              },
            },
          },
        },
        options: {
          type: 'object',
          properties: {
            qrUrl: { type: 'string' },
            showPkLogo: { type: 'boolean' },
            pkLogo: { type: 'string', enum: ['pk', 'wiim', 'kms'] },
            showSknmLogo: { type: 'boolean' },
            wideSubtitle: { type: 'boolean' },
            ciekawostkaLayout: { type: 'string', enum: ['zdjecie', 'panorama', 'archiwum'] },
            fillAgenda: { type: 'boolean' },
            titleScale: { type: 'number', minimum: 0.7, maximum: 1.3 },
            textScale: { type: 'number', minimum: 0.7, maximum: 1.3 },
          },
        },
      },
    },
  },
]

const ok = (id: Id, result: unknown) => ({ jsonrpc: '2.0', id, result })
const err = (id: Id, code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } })
const text = (t: string, isError = false) => ({ content: [{ type: 'text', text: t }], ...(isError ? { isError: true } : {}) })

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export const RATE_LIMITED_MESSAGE = 'Za dużo wywołań. Spróbuj ponownie za chwilę.'

interface Deps { generate: typeof generate }

async function callTool(env: Env, id: Id, params: unknown, deps: Deps) {
  if (!isObject(params) || typeof params.name !== 'string') return err(id, -32602, 'Brak nazwy narzędzia.')
  if (params.name === 'list_templates') return ok(id, text(JSON.stringify(templates)))
  if (params.name !== 'generate_image') return err(id, -32602, `Nieznane narzędzie: ${params.name}`)
  // Limit tylko dla generowania; błąd jako zwykły wynik narzędzia, nie HTTP 429.
  const { success } = await env.RATE_LIMITER.limit({ key: 'global' })
  if (!success) return ok(id, text(`rate_limited: ${RATE_LIMITED_MESSAGE}`, true))
  const result = await deps.generate(env, params.arguments ?? {})
  if (!result.ok) return ok(id, text(`${result.error.code}: ${result.error.message}`, true))
  const { url, historyId, png } = result.value
  return ok(id, {
    content: [
      { type: 'text', text: `Grafika: ${url}\nWpis w historii: #${historyId}` },
      { type: 'image', data: png, mimeType: 'image/png' },
    ],
  })
}

// Zwraca odpowiedź albo null (notyfikacja).
async function handleOne(env: Env, msg: unknown, deps: Deps): Promise<unknown | null> {
  if (!isObject(msg) || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return err(null, -32600, 'Nieprawidłowe żądanie.')
  const req = msg as unknown as RpcRequest
  if (req.id === undefined) return null
  const id = req.id
  if (req.method.startsWith('notifications/')) return null
  switch (req.method) {
    case 'initialize': {
      const asked = isObject(req.params) ? req.params.protocolVersion : undefined
      const version = typeof asked === 'string' && PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0]
      return ok(id, { protocolVersion: version, capabilities: { tools: {} }, serverInfo: { name: 'sknm-generator', version: '1' } })
    }
    case 'ping':
      return ok(id, {})
    case 'tools/list':
      return ok(id, { tools })
    case 'tools/call':
      return callTool(env, id, req.params, deps)
    default:
      return err(id, -32601, `Nieznana metoda: ${req.method}`)
  }
}

export async function handleMcp(request: Request, env: Env, deps: Deps = { generate }): Promise<Response> {
  if (request.method !== 'POST') return new Response('Niedozwolona metoda.', { status: 405, headers: { Allow: 'POST' } })
  const raw = await readBody(request)
  if (raw === null) return jsonResponse(err(null, -32600, 'Treść żądania jest większa niż 25 MB.'), 413)
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return jsonResponse(err(null, -32700, 'Treść żądania nie jest poprawnym JSON.'))
  }
  // MCP 2025-06-18 nie przewiduje paczek; jedna paczka mogłaby ominąć limit wywołań.
  if (Array.isArray(body)) return jsonResponse(err(null, -32600, 'Paczki żądań nie są obsługiwane.'))
  let out: unknown
  try {
    out = await handleOne(env, body, deps)
  } catch (e) {
    console.error('MCP: nieoczekiwany błąd', e)
    const id = isObject(body) && (typeof body.id === 'string' || typeof body.id === 'number') ? body.id : null
    return jsonResponse(err(id, -32603, 'Wewnętrzny błąd serwera.'))
  }
  return out === null ? new Response(null, { status: 202 }) : jsonResponse(out)
}
