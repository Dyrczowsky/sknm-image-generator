import type { SupabaseClient } from '@supabase/supabase-js'

// Jedno wywołanie metody budowniczego zapytań, np. `['order', 'created_at', { ascending: false }]`.
export type Call = [method: string, ...args: unknown[]]

interface FakeResult {
  data?: unknown
  error?: { message: string } | null
}

// Błąd Storage niesie dodatkowo kod HTTP i kod z treści odpowiedzi.
interface FakeStorageResult {
  data?: unknown
  error?: { message: string; status?: number; statusCode?: string; code?: string } | null
}

// Wynik operacji na Storage: stały albo zależny od nazwy pliku.
type FakeStorageAnswer = FakeStorageResult | ((path: string) => FakeStorageResult)

interface FakeStorage {
  upload?: FakeStorageAnswer
  download?: FakeStorageAnswer
}

// Atrapa klienta Supabase do testów: zapisuje łańcuch wywołań każdego
// zapytania i kończy je podanym wynikiem. Zapytania są w `queries`,
// w kolejności wykonania; pierwszym elementem każdego jest `['from', tabela]`.
//
// Storage działa tak samo: każda operacja trafia do `storageCalls` jako
// `[['from', kubełek], ['upload', nazwa, plik, opcje]]` albo
// `[['from', kubełek], ['download', nazwa]]`, a kończy się wynikiem ze `storage`.
export function fakeSupabase(result: FakeResult = {}, storage: FakeStorage = {}) {
  const queries: Call[][] = []
  const storageCalls: Call[][] = []

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

  const storageFrom = (bucket: string) => {
    const operation =
      (method: keyof FakeStorage) =>
      async (path: string, ...args: unknown[]) => {
        storageCalls.push([['from', bucket], [method, path, ...args]])
        const answer = storage[method]
        const settled = typeof answer === 'function' ? answer(path) : (answer ?? {})
        return { data: settled.data ?? null, error: settled.error ?? null }
      }
    return { upload: operation('upload'), download: operation('download') }
  }

  return { client: { from, storage: { from: storageFrom } } as unknown as SupabaseClient, queries, storageCalls }
}
