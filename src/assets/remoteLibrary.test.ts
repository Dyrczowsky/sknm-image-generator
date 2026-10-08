import { describe, expect, it } from 'vitest'
import { fakeSupabase } from '../supabase/fakeClient'
import { ASSETS_LIMIT, ASSET_NAME_MAX_LENGTH, listAssets, registerAsset, removeAsset, renameAsset } from './remoteLibrary'
import type { LibraryAsset } from './remoteLibrary'

const COLUMNS = 'ref, created_at, author_email, kind, name'
const REF = `${'a'.repeat(64)}.png`
const asset = (): LibraryAsset => ({ ref: REF, created_at: '2031-01-01T10:00:00Z', author_email: 'a@b.pl', kind: 'logo', name: 'Logo' })

describe('listAssets', () => {
  it('czyta całą bibliotekę od najnowszej', async () => {
    const rows = [asset()]
    const { client, queries } = fakeSupabase({ data: rows })
    expect(await listAssets(client)).toEqual(rows)
    expect(queries).toEqual([[['from', 'sknm_assets'], ['select', COLUMNS], ['order', 'created_at', { ascending: false }], ['limit', ASSETS_LIMIT]]])
  })

  it('z rodzajem filtruje po kind', async () => {
    const { client, queries } = fakeSupabase({ data: [] })
    await listAssets(client, 'logo')
    expect(queries).toEqual([[
      ['from', 'sknm_assets'],
      ['select', COLUMNS],
      ['order', 'created_at', { ascending: false }],
      ['limit', ASSETS_LIMIT],
      ['eq', 'kind', 'logo'],
    ]])
  })

  it('błąd Supabase → wyjątek', async () => {
    const { client } = fakeSupabase({ error: { message: 'denied' } })
    await expect(listAssets(client)).rejects.toThrow('denied')
  })
})

describe('registerAsset', () => {
  it('wstawia same ref, kind i name', async () => {
    const { client, queries } = fakeSupabase()
    await registerAsset(client, { ref: REF, kind: 'logo', name: 'Logo' })
    expect(queries).toEqual([[['from', 'sknm_assets'], ['insert', { ref: REF, kind: 'logo', name: 'Logo' }]]])
  })

  it('obcina nazwę do limitu kolumny', async () => {
    const { client, queries } = fakeSupabase()
    await registerAsset(client, { ref: REF, kind: 'photo', name: 'x'.repeat(300) })
    expect(queries[0]![1]).toEqual(['insert', { ref: REF, kind: 'photo', name: 'x'.repeat(ASSET_NAME_MAX_LENGTH) }])
  })

  it('duplikat klucza (23505) to sukces', async () => {
    const { client } = fakeSupabase({ error: { message: 'duplicate key', code: '23505' } as { message: string } })
    await expect(registerAsset(client, { ref: REF, kind: 'logo', name: 'Logo' })).resolves.toBeUndefined()
  })

  it('inny błąd → wyjątek', async () => {
    const { client } = fakeSupabase({ error: { message: 'denied', code: '42501' } as { message: string } })
    await expect(registerAsset(client, { ref: REF, kind: 'logo', name: 'Logo' })).rejects.toThrow('denied')
  })
})

describe('renameAsset i removeAsset', () => {
  it('renameAsset zmienia samą nazwę (obciętą)', async () => {
    const { client, queries } = fakeSupabase()
    await renameAsset(client, REF, 'y'.repeat(200))
    expect(queries).toEqual([[['from', 'sknm_assets'], ['update', { name: 'y'.repeat(ASSET_NAME_MAX_LENGTH) }], ['eq', 'ref', REF]]])
  })

  it('removeAsset usuwa po ref', async () => {
    const { client, queries } = fakeSupabase()
    await removeAsset(client, REF)
    expect(queries).toEqual([[['from', 'sknm_assets'], ['delete'], ['eq', 'ref', REF]]])
  })

  it('błąd Supabase → wyjątek', async () => {
    const { client } = fakeSupabase({ error: { message: 'boom' } })
    await expect(renameAsset(client, REF, 'a')).rejects.toThrow('boom')
    await expect(removeAsset(client, REF)).rejects.toThrow('boom')
  })
})
