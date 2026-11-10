import { describe, expect, it } from 'vitest'
import type { Env } from './env'
import { supabase } from './supabase'

const KEY = 'service-role-SECRET-key'
const REF = 'a'.repeat(64)
const PATH = '2026-11-10/' + '1'.repeat(8) + '-' + '1'.repeat(4) + '-' + '1'.repeat(4) + '-' + '1'.repeat(4) + '-' + '1'.repeat(12) + '.png'
const env = { SUPABASE_URL: 'https://p.supabase.co', SUPABASE_SERVICE_ROLE_KEY: KEY } as Env

function fake(res: Response) {
  const calls: { url: string; init: RequestInit }[] = []
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return res.clone()
  }) as unknown as typeof fetch
  return { calls, impl }
}

describe('uploadAsset', () => {
  it('409 oznacza sukces', async () => {
    const f = fake(new Response('{}', { status: 409 }))
    await expect(supabase(env, f.impl).uploadAsset(REF+'.jpg', new Uint8Array([1]), 'image/jpeg')).resolves.toBeUndefined()
    expect(f.calls[0].url).toBe('https://p.supabase.co/storage/v1/object/sknm-poster-assets/'+REF+'.jpg')
    const h = f.calls[0].init.headers as Record<string, string>
    expect(h['x-upsert']).toBe('false')
    expect(h.Authorization).toBe(`Bearer ${KEY}`)
  })
  it('400 "already exists" oznacza sukces', async () => {
    const f = fake(new Response('{"error":"Duplicate","message":"The resource already exists"}', { status: 400 }))
    await expect(supabase(env, f.impl).uploadAsset(REF+'.png', new Uint8Array([1]), 'image/png')).resolves.toBeUndefined()
  })
  it('500 odrzuca, a komunikat nie zawiera klucza', async () => {
    const f = fake(new Response(`boom ${KEY}`, { status: 500 }))
    const err = await supabase(env, f.impl).uploadAsset(REF+'.png', new Uint8Array([1]), 'image/png').catch((e: Error) => e)
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toContain('500')
    expect((err as Error).message).not.toContain(KEY)
  })
  it('błąd sieci nie ujawnia klucza', async () => {
    const impl = (async () => { throw new Error(`fail ${KEY}`) }) as unknown as typeof fetch
    const err = await supabase(env, impl).uploadAsset(REF+'.png', new Uint8Array([1]), 'image/png').catch((e: Error) => e)
    expect((err as Error).message).not.toContain(KEY)
  })
})

describe('walidacja nazw', () => {
  it('uploadAsset odrzuca ../ i niezgodne rozszerzenie bez wywołania fetch', async () => {
    const f = fake(new Response('{}'))
    const sb = supabase(env, f.impl)
    await expect(sb.uploadAsset('../x.png', new Uint8Array([1]), 'image/png')).rejects.toThrow('nieprawidłowa')
    await expect(sb.uploadAsset(REF + '.png', new Uint8Array([1]), 'image/jpeg')).rejects.toThrow('nieprawidłowa')
    expect(f.calls).toHaveLength(0)
  })
  it('uploadImage odrzuca ścieżkę spoza wzorca bez wywołania fetch', async () => {
    const f = fake(new Response('{}'))
    await expect(supabase(env, f.impl).uploadImage('../../x.png', new Uint8Array([1]))).rejects.toThrow('nieprawidłowa')
    expect(f.calls).toHaveLength(0)
  })
})

describe('uploadImage', () => {
  it('zwraca publiczny URL i wysyła image/png', async () => {
    const f = fake(new Response('{}', { status: 200 }))
    const url = await supabase(env, f.impl).uploadImage(PATH, new Uint8Array([1]))
    expect(url).toBe('https://p.supabase.co/storage/v1/object/public/sknm-ai-images/'+PATH+'')
    expect(f.calls[0].url).toBe('https://p.supabase.co/storage/v1/object/sknm-ai-images/'+PATH+'')
    expect((f.calls[0].init.headers as Record<string, string>)['Content-Type']).toBe('image/png')
  })
  it('błąd zapisu rzuca', async () => {
    const f = fake(new Response('no', { status: 403 }))
    await expect(supabase(env, f.impl).uploadImage(PATH, new Uint8Array([1]))).rejects.toThrow('403')
  })
})

describe('insertHistory', () => {
  it('pusta tablica lub nie-JSON to błąd bez id', async () => {
    for (const body of ['[]', 'nie json']) {
      const f = fake(new Response(body, { status: 201 }))
      await expect(supabase(env, f.impl).insertHistory({} as never)).rejects.toThrow('brak id')
    }
  })
  it('wysyła source ai i zwraca id', async () => {
    const f = fake(new Response('[{"id":42}]', { status: 201 }))
    const id = await supabase(env, f.impl).insertHistory({ source: 'ai', image_url: 'https://i/x.png' } as never)
    expect(id).toBe(42)
    expect(f.calls[0].url).toBe('https://p.supabase.co/rest/v1/sknm_poster_history')
    expect(JSON.parse(f.calls[0].init.body as string)).toMatchObject({ source: 'ai', image_url: 'https://i/x.png' })
    expect((f.calls[0].init.headers as Record<string, string>).Prefer).toBe('return=representation')
  })
  it('błąd rzuca bez klucza', async () => {
    const f = fake(new Response(KEY, { status: 401 }))
    const err = await supabase(env, f.impl).insertHistory({} as never).catch((e: Error) => e)
    expect((err as Error).message).toContain('401')
    expect((err as Error).message).not.toContain(KEY)
  })
})
