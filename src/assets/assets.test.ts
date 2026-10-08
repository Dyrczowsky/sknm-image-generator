import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from '../supabase/fakeClient'
import { AssetTooLargeError, blobToDataUrl, ensureUploaded, gcLocal, hydrate, importImage, libraryErrorMessage } from './assets'
import type { AssetDeps } from './assets'
import { refFor } from './hash'
import { createLocalStore } from './localStore'
import { ImageImportError, MAX_ASSET_BYTES } from './prepare'
import type { LocalAsset } from './localStore'
import { refOf, register, resetRegistry, srcOf } from './registry'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"/>'
const SVG_DATA_URL = `data:image/svg+xml;base64,${btoa(SVG)}`
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 255, 128])
const PNG_DATA_URL = `data:image/png;base64,${btoa(String.fromCharCode(...PNG_BYTES))}`
const MISSING = `${'f'.repeat(64)}.jpg`

const pngBlob = () => new Blob([PNG_BYTES], { type: 'image/png' })
const pngRef = () => refFor(PNG_BYTES, 'image/png')
const asset = (overrides: Partial<LocalAsset> = {}): LocalAsset => ({ blob: pngBlob(), remote: false, kind: 'logo', name: 'logo.png', ...overrides })

// Magazyn na `Map` zamiast IndexedDB; `gets` liczy odczyty.
function setup() {
  const map = new Map<string, unknown>()
  const gets: string[] = []
  const local = createLocalStore({
    get: async (key) => {
      gets.push(key)
      return map.get(key)
    },
    set: async (key, value) => void map.set(key, value),
    del: async (key) => void map.delete(key),
    keys: async () => [...map.keys()],
  })
  // Bez canvasa: plik przechodzi bez zmian.
  const deps: AssetDeps = { local, prepare: async (file) => file, toDataUrl: blobToDataUrl }
  return { deps, local, map, gets }
}

beforeEach(resetRegistry)

describe('blobToDataUrl', () => {
  it('base64 z typem podanym jawnie, nie z bloba', async () => {
    expect(await blobToDataUrl(new Blob([PNG_BYTES]), 'image/png')).toBe(PNG_DATA_URL)
    expect(await blobToDataUrl(new Blob([SVG], { type: 'text/plain' }), 'image/svg+xml')).toBe(SVG_DATA_URL)
  })

  it('duży plik (wiele porcji) koduje się poprawnie', async () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 251)
    const url = await blobToDataUrl(new Blob([bytes]), 'image/jpeg')
    expect(url).toBe(`data:image/jpeg;base64,${Buffer.from(bytes).toString('base64')}`)
  })
})

describe('importImage', () => {
  it('zapisuje lokalnie, rejestruje i zwraca data URL', async () => {
    const { deps, local } = setup()
    const file = new File([SVG], 'patron.svg', { type: 'image/svg+xml' })
    const ref = await refFor(new TextEncoder().encode(SVG), 'image/svg+xml')

    expect(await importImage(file, 'logo', deps)).toBe(SVG_DATA_URL)
    expect(await local.get(ref)).toEqual({ blob: file, remote: false, kind: 'logo', name: 'patron.svg' })
    expect(srcOf(ref)).toBe(SVG_DATA_URL)
    expect(refOf(SVG_DATA_URL)).toBe(ref)
  })

  it('nazwę liczy z przygotowanych bajtów, nie z oryginału', async () => {
    const { deps, local } = setup()
    const file = new File(['duże zdjęcie'], 'foto.jpg', { type: 'image/jpeg' })
    const shrunk = new Blob(['małe'], { type: 'image/jpeg' })
    const ref = await refFor(new TextEncoder().encode('małe'), 'image/jpeg')

    await importImage(file, 'photo', { ...deps, prepare: async () => shrunk })
    expect(await local.get(ref)).toEqual({ blob: shrunk, remote: false, kind: 'photo', name: 'foto.jpg' })
  })

  it('ta sama grafika drugi raz nie kasuje znacznika remote', async () => {
    const { deps, local } = setup()
    const ref = await pngRef()
    const stored = asset({ remote: true, name: 'pierwsza.png' })
    await local.put(ref, stored)

    expect(await importImage(new File([PNG_BYTES], 'druga.png', { type: 'image/png' }), 'photo', deps)).toBe(PNG_DATA_URL)
    expect(await local.get(ref)).toBe(stored)
  })

  it('zdjęcie niewgrane do Storage, dodane ponownie jako logotyp, zmienia rodzaj na wybrany teraz', async () => {
    const { deps, local } = setup()
    const ref = await pngRef()
    const stored = asset({ kind: 'photo', name: 'pierwsza.png' })
    await local.put(ref, stored)

    await importImage(new File([PNG_BYTES], 'druga.png', { type: 'image/png' }), 'logo', deps)
    expect(await local.get(ref)).toEqual({ ...stored, kind: 'logo' })
  })

  it('przygotowana grafika ponad limit kubełka → odrzucona, nic nie zostaje zapisane', async () => {
    const { deps, map } = setup()
    const file = new File(['x'], 'ogromne.png', { type: 'image/png' })
    const huge = new Blob([new Uint8Array(MAX_ASSET_BYTES + 1)], { type: 'image/png' })

    const error = await importImage(file, 'photo', { ...deps, prepare: async () => huge }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ImageImportError)
    expect((error as ImageImportError).message).toBe('Plik „ogromne.png" jest za duży. Limit to 5 MB.')
    expect(map.size).toBe(0)
  })

  it('nieobsługiwany format → typowany błąd z komunikatem', async () => {
    const { deps, map } = setup()
    const file = new File(['GIF89a'], 'anim.gif', { type: 'image/gif' })
    const { prepareImage } = await import('./prepare')

    const error = await importImage(file, 'photo', { ...deps, prepare: prepareImage }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ImageImportError)
    expect((error as ImageImportError).reason).toBe('unsupported')
    expect(map.size).toBe(0)
  })
})

describe('hydrate', () => {
  it('grafika w rejestrze → bez odczytu magazynu i bez pobierania', async () => {
    const { deps, gets } = setup()
    const { client, storageCalls } = fakeSupabase()
    const ref = await pngRef()
    register(ref, PNG_DATA_URL)

    expect(await hydrate([ref], client, deps)).toEqual([])
    expect(gets).toEqual([])
    expect(storageCalls).toEqual([])
  })

  it('kopia lokalna → rejestr, bez pobierania', async () => {
    const { deps, local } = setup()
    const { client, storageCalls } = fakeSupabase()
    const ref = await pngRef()
    // Blob z IndexedDB bez typu - MIME ma pochodzić z rozszerzenia nazwy.
    await local.put(ref, asset({ blob: new Blob([PNG_BYTES]) }))

    expect(await hydrate([ref], client, deps)).toEqual([])
    expect(srcOf(ref)).toBe(PNG_DATA_URL)
    expect(refOf(PNG_DATA_URL)).toBe(ref)
    expect(storageCalls).toEqual([])
  })

  it('tylko w Storage → pobiera i zapisuje lokalnie jako remote', async () => {
    const { deps, local } = setup()
    const blob = pngBlob()
    const { client, storageCalls } = fakeSupabase({}, { download: { data: blob } })
    const ref = await pngRef()

    expect(await hydrate([ref], client, deps)).toEqual([])
    expect(storageCalls).toEqual([[['from', 'sknm-poster-assets'], ['download', ref]]])
    expect(srcOf(ref)).toBe(PNG_DATA_URL)
    expect(await local.get(ref)).toMatchObject({ blob, remote: true })

    // Drugi raz już z rejestru.
    await hydrate([ref], client, deps)
    expect(storageCalls).toHaveLength(1)
  })

  it('plik w Storage o innej treści niż jego nazwa → odrzucony i niezapisany', async () => {
    const { deps, local } = setup()
    const podmieniony = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
    const { client } = fakeSupabase({}, { download: { data: podmieniony } })
    const ref = await pngRef()

    expect(await hydrate([ref], client, deps)).toEqual([ref])
    expect(srcOf(ref)).toBeUndefined()
    expect(await local.get(ref)).toBeUndefined()
  })

  it('nigdzie nie ma → zwraca nazwę jako nierozwiązaną', async () => {
    const { deps, map } = setup()
    const { client } = fakeSupabase({}, { download: { error: { message: 'Object not found', status: 400, statusCode: '404' } } })

    expect(await hydrate([MISSING], client, deps)).toEqual([MISSING])
    expect(srcOf(MISSING)).toBeUndefined()
    expect(map.size).toBe(0)
  })

  it('bez klienta szuka tylko lokalnie', async () => {
    const { deps, local } = setup()
    const ref = await pngRef()
    await local.put(ref, asset())
    expect(await hydrate([ref, MISSING], null, deps)).toEqual([MISSING])
  })

  it('miesza źródła, pomija powtórki i nie pyta Storage o złe nazwy', async () => {
    const { deps, local } = setup()
    const ref = await pngRef()
    await local.put(ref, asset())
    const { client, storageCalls } = fakeSupabase({}, { download: { error: { message: 'Object not found' } } })

    expect(await hydrate([ref, MISSING, 'nie-nazwa.png', MISSING, ref], client, deps)).toEqual([MISSING, 'nie-nazwa.png'])
    expect(storageCalls).toEqual([[['from', 'sknm-poster-assets'], ['download', MISSING]]])
  })

  describe('jedna zepsuta grafika kosztuje tę grafikę, nie całe wczytanie', () => {
    const SVG_BYTES = new TextEncoder().encode(SVG)
    const svgRef = () => refFor(SVG_BYTES, 'image/svg+xml')

    it('błąd odczytu kopii lokalnej jednej grafiki: pozostałe się wczytują', async () => {
      const { deps, local } = setup()
      const good = await pngRef()
      const bad = await svgRef()
      await local.put(good, asset())
      const get = local.get
      local.get = async (ref) => {
        if (ref === bad) throw new Error('IndexedDB: UnknownError')
        return get(ref)
      }

      expect(await hydrate([bad, good], null, deps)).toEqual([bad])
      expect(srcOf(good)).toBe(PNG_DATA_URL)
    })

    it('błąd odczytu kopii lokalnej, ale grafika jest w Storage: pobrana', async () => {
      const { deps, local } = setup()
      const { client } = fakeSupabase({}, { download: { data: pngBlob() } })
      const ref = await pngRef()
      local.get = async () => {
        throw new Error('IndexedDB: UnknownError')
      }

      expect(await hydrate([ref], client, deps)).toEqual([])
      expect(srcOf(ref)).toBe(PNG_DATA_URL)
    })

    it('zapis pobranej grafiki się nie udaje (brak miejsca): i tak działa w tej sesji', async () => {
      const { deps, local, map } = setup()
      const { client } = fakeSupabase({}, { download: { data: pngBlob() } })
      const ref = await pngRef()
      local.put = async () => {
        throw new DOMException('quota', 'QuotaExceededError')
      }

      expect(await hydrate([ref], client, deps)).toEqual([])
      expect(srcOf(ref)).toBe(PNG_DATA_URL)
      expect(map.size).toBe(0)
    })

    it('błąd zamiany na data URL: grafika nierozwiązana', async () => {
      const { deps, local } = setup()
      const good = await pngRef()
      const bad = await svgRef()
      await local.put(good, asset())
      await local.put(bad, asset({ blob: new Blob([SVG_BYTES]) }))
      const toDataUrl: AssetDeps['toDataUrl'] = async (blob, mime) => {
        if (mime === 'image/svg+xml') throw new Error('read failed')
        return blobToDataUrl(blob, mime)
      }

      expect(await hydrate([bad, good], null, { ...deps, toDataUrl })).toEqual([bad])
      expect(srcOf(bad)).toBeUndefined()
      expect(srcOf(good)).toBe(PNG_DATA_URL)
    })

    it('blob, którego nie da się odczytać po pobraniu: grafika nierozwiązana', async () => {
      const { deps } = setup()
      const broken = { arrayBuffer: () => Promise.reject(new Error('NotReadableError')) } as unknown as Blob
      const { client } = fakeSupabase({}, { download: { data: broken } })
      const ref = await pngRef()

      expect(await hydrate([ref], client, deps)).toEqual([ref])
    })
  })
})

describe('ensureUploaded', () => {
  it('wgrywa niewgrane, oznacza i zgłasza; wgrane pomija bez sieci', async () => {
    const { deps, local } = setup()
    const { client, storageCalls } = fakeSupabase()
    const fresh = await pngRef()
    const done = `${'d'.repeat(64)}.jpg`
    const stored = asset({ kind: 'logo', name: 'patron.png' })
    await local.put(fresh, stored)
    await local.put(done, asset({ remote: true, kind: 'photo', name: 'foto.jpg' }))
    const onUploaded = vi.fn()

    await ensureUploaded([done, fresh, fresh], client, onUploaded, deps)

    expect(storageCalls).toEqual([
      [['from', 'sknm-poster-assets'], ['upload', fresh, stored.blob, { contentType: 'image/png', upsert: false, cacheControl: '31536000' }]],
    ])
    expect(await local.get(fresh)).toEqual({ ...stored, remote: true })
    expect(onUploaded.mock.calls).toEqual([[{ ref: fresh, kind: 'logo', name: 'patron.png' }]])

    // Kolejny zapis projektu nie wysyła już nic.
    await ensureUploaded([done, fresh], client, onUploaded, deps)
    expect(storageCalls).toHaveLength(1)
    expect(onUploaded).toHaveBeenCalledTimes(1)
  })

  it('409 (plik już jest w Storage) → sukces i znacznik', async () => {
    const { deps, local } = setup()
    const { client } = fakeSupabase({}, { upload: { error: { message: 'The resource already exists', status: 400, statusCode: '409' } } })
    const ref = await pngRef()
    await local.put(ref, asset())
    const onUploaded = vi.fn()

    await ensureUploaded([ref], client, onUploaded, deps)
    expect((await local.get(ref))?.remote).toBe(true)
    expect(onUploaded).toHaveBeenCalledTimes(1)
  })

  it('inny błąd → wyjątek, grafika zostaje niewgrana', async () => {
    const { deps, local } = setup()
    const { client } = fakeSupabase({}, { upload: { error: { message: 'row-level security', status: 403, statusCode: '403' } } })
    const ref = await pngRef()
    await local.put(ref, asset())
    const onUploaded = vi.fn()

    await expect(ensureUploaded([ref], client, onUploaded, deps)).rejects.toThrow('row-level security')
    expect((await local.get(ref))?.remote).toBe(false)
    expect(onUploaded).not.toHaveBeenCalled()
  })

  it('błąd w onUploaded → wyjątek i brak znacznika, więc następna próba powtórzy wpis', async () => {
    const { deps, local } = setup()
    const { client } = fakeSupabase()
    const ref = await pngRef()
    await local.put(ref, asset())

    await expect(ensureUploaded([ref], client, () => Promise.reject(new Error('biblioteka niedostępna')), deps)).rejects.toThrow('biblioteka niedostępna')
    expect((await local.get(ref))?.remote).toBe(false)
  })

  it('brak lokalnej kopii → błąd z nazwą grafiki', async () => {
    const { deps } = setup()
    const { client, storageCalls } = fakeSupabase()
    await expect(ensureUploaded([MISSING], client, undefined, deps)).rejects.toThrow(MISSING)
    expect(storageCalls).toEqual([])
  })

  it('lokalna grafika ponad limit kubełka → błąd rozmiaru z nazwą pliku, bez żądania', async () => {
    const { deps, local } = setup()
    const { client, storageCalls } = fakeSupabase()
    const ref = `${'b'.repeat(64)}.png`
    await local.put(ref, asset({ blob: new Blob([new Uint8Array(MAX_ASSET_BYTES + 1)]), name: 'baner.png' }))

    const error = await ensureUploaded([ref], client, undefined, deps).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(AssetTooLargeError)
    expect((error as AssetTooLargeError).ref).toBe(ref)
    expect((error as AssetTooLargeError).message).toContain('„baner.png"')
    expect((error as AssetTooLargeError).message).toContain('5 MB')
    expect(storageCalls).toEqual([])
    expect((await local.get(ref))?.remote).toBe(false)
  })

  it.each([
    [{ message: 'The object exceeded the maximum allowed size', status: 400, statusCode: '413' }],
    [{ message: 'Payload too large', status: 413 }],
    [{ message: 'x', code: 'EntityTooLarge' }],
  ])('Storage odrzuca plik za rozmiar (%j) → błąd rozmiaru, nie ogólny', async (storageError) => {
    const { deps, local } = setup()
    const { client } = fakeSupabase({}, { upload: { error: storageError } })
    const ref = await pngRef()
    await local.put(ref, asset({ name: '' }))

    const error = await ensureUploaded([ref], client, undefined, deps).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(AssetTooLargeError)
    expect((error as AssetTooLargeError).message).toContain('5 MB')
  })
})

describe('gcLocal', () => {
  it('usuwa wgrane grafiki spoza listy, cudzych kluczy nie rusza', async () => {
    const { deps, local, map } = setup()
    map.set('sknm-workspace', {})
    const keep = await pngRef()
    await local.put(keep, asset({ remote: true }))
    await local.put(MISSING, asset({ remote: true }))

    await gcLocal([keep], deps)
    expect(await local.refs()).toEqual([keep])
    expect(map.has('sknm-workspace')).toBe(true)
  })

  it('niewgranej grafiki nie usuwa - może jej potrzebować inna karta', async () => {
    const { deps, local } = setup()
    await local.put(MISSING, asset({ remote: false }))

    await gcLocal([], deps)
    expect(await local.refs()).toEqual([MISSING])
  })
})

describe('libraryErrorMessage', () => {
  it('błędy typowane mówią własnym komunikatem, reszta radzi sprawdzić połączenie', () => {
    const tooLarge = new AssetTooLargeError(MISSING, 'duze.png')
    expect(libraryErrorMessage(tooLarge, 'duze.png')).toBe(tooLarge.message)
    const unsupported = new ImageImportError('unsupported', 'Nieobsługiwany format.')
    expect(libraryErrorMessage(unsupported, 'a.gif')).toBe('Nieobsługiwany format.')
    expect(libraryErrorMessage(new Error('network'), 'a.png')).toBe('Nie udało się dodać „a.png" do biblioteki. Sprawdź połączenie i spróbuj ponownie.')
  })
})
