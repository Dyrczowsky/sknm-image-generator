import { describe, expect, it } from 'vitest'
import { fakeSupabase } from '../supabase/fakeClient'
import { downloadAsset, isDuplicateUpload, uploadAsset } from './remoteStore'

const REF = `${'a'.repeat(64)}.jpg`
const blob = new Blob(['zdjęcie'], { type: 'image/jpeg' })

describe('uploadAsset', () => {
  it('wgrywa pod nazwą grafiki, bez nadpisywania, z rocznym cache', async () => {
    const { client, storageCalls } = fakeSupabase()
    await uploadAsset(client, REF, blob)
    expect(storageCalls).toEqual([[['from', 'sknm-poster-assets'], ['upload', REF, blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' }]]])
  })

  it('typ MIME bierze z rozszerzenia, nie z bloba', async () => {
    const { client, storageCalls } = fakeSupabase()
    const ref = `${'b'.repeat(64)}.svg`
    await uploadAsset(client, ref, new Blob(['<svg/>']))
    expect(storageCalls[0][1][3]).toMatchObject({ contentType: 'image/svg+xml' })
  })

  it('plik już istnieje → sukces', async () => {
    // Kształt z storage-js: StorageApiError { status, statusCode, message }.
    const classic = fakeSupabase({}, { upload: { error: { message: 'The resource already exists', status: 400, statusCode: '409' } } })
    await expect(uploadAsset(classic.client, REF, blob)).resolves.toBeUndefined()
    const http = fakeSupabase({}, { upload: { error: { message: 'Conflict', status: 409 } } })
    await expect(uploadAsset(http.client, REF, blob)).resolves.toBeUndefined()
  })

  it('inny błąd → wyjątek', async () => {
    const { client } = fakeSupabase({}, { upload: { error: { message: 'new row violates row-level security policy', status: 403, statusCode: '403' } } })
    await expect(uploadAsset(client, REF, blob)).rejects.toThrow('row-level security')
  })
})

describe('isDuplicateUpload', () => {
  it('rozpoznaje duplikat po kodzie HTTP, kodzie z odpowiedzi albo komunikacie', () => {
    expect(isDuplicateUpload({ status: 409 })).toBe(true)
    expect(isDuplicateUpload({ status: 400, statusCode: '409' })).toBe(true)
    expect(isDuplicateUpload({ status: 400, code: 'ResourceAlreadyExists' })).toBe(true)
    expect(isDuplicateUpload({ message: 'The resource already exists' })).toBe(true)
    expect(isDuplicateUpload({ message: 'Duplicate' })).toBe(true)
    expect(isDuplicateUpload({ status: 403, statusCode: '403', message: 'Unauthorized' })).toBe(false)
    expect(isDuplicateUpload({ status: 413, message: 'The object exceeded the maximum allowed size' })).toBe(false)
  })
})

describe('downloadAsset', () => {
  it('pobiera plik z kubełka', async () => {
    const { client, storageCalls } = fakeSupabase({}, { download: { data: blob } })
    expect(await downloadAsset(client, REF)).toBe(blob)
    expect(storageCalls).toEqual([[['from', 'sknm-poster-assets'], ['download', REF]]])
  })

  it('błąd Storage → wyjątek', async () => {
    const { client } = fakeSupabase({}, { download: { error: { message: 'Object not found' } } })
    await expect(downloadAsset(client, REF)).rejects.toThrow('Object not found')
  })

  it('brak danych → wyjątek z nazwą', async () => {
    const { client } = fakeSupabase()
    await expect(downloadAsset(client, REF)).rejects.toThrow(REF)
  })
})
