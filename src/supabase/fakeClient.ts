import type { SupabaseClient } from '@supabase/supabase-js'

// Jedno wywołanie metody budowniczego zapytań, np. `['order', 'created_at', { ascending: false }]`.
export type Call = [method: string, ...args: unknown[]]

interface FakeResult {
  data?: unknown
  error?: { message: string } | null
}

// Atrapa klienta Supabase do testów: zapisuje łańcuch wywołań każdego
// zapytania i kończy je podanym wynikiem. Zapytania są w `queries`,
// w kolejności wykonania; pierwszym elementem każdego jest `['from', tabela]`.
export function fakeSupabase(result: FakeResult = {}) {
  const queries: Call[][] = []

  const from = (table: string) => {
    const calls: Call[] = [['from', table]]
    queries.push(calls)
    const builder: Record<string, unknown> = new Proxy(
      {},
      {
        get(_, method: string) {
          // `await zapytanie` kończy łańcuch.
          if (method === 'then') {
            const settled = Promise.resolve({ data: result.data ?? null, error: result.error ?? null })
            return settled.then.bind(settled)
          }
          return (...args: unknown[]) => {
            calls.push([method, ...args])
            return builder
          }
        },
      },
    )
    return builder
  }

  return { client: { from } as unknown as SupabaseClient, queries }
}
