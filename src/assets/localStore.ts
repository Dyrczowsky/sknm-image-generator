import { del, get, keys, set } from 'idb-keyval'

// Kopia wgranej grafiki w przeglądarce (IndexedDB), pod nazwą `<sha256>.<rozszerzenie>`.
export interface LocalAsset {
  blob: Blob
  // Czy plik jest już w Storage - wtedy nie trzeba go wgrywać ponownie.
  remote: boolean
  // Pole, w którym grafikę dodano: stopka (logo) albo galeria zdjęć (photo).
  kind: 'logo' | 'photo'
  // Nazwa pliku użytkownika - podpis w bibliotece grafik.
  name: string
}

// Minimum z idb-keyval, którego potrzebuje magazyn; w testach podstawia się `Map`.
export interface KeyValueStore {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  del(key: string): Promise<void>
  keys(): Promise<unknown[]>
}

export interface LocalStore {
  get(ref: string): Promise<LocalAsset | undefined>
  put(ref: string, asset: LocalAsset): Promise<void>
  // Oznacza grafikę jako wgraną do Storage; nic nie robi, gdy jej nie ma.
  markRemote(ref: string): Promise<void>
  remove(ref: string): Promise<void>
  // Nazwy wszystkich grafik trzymanych lokalnie.
  refs(): Promise<string[]>
}

const KEY_PREFIX = 'sknm-asset:'

export function createLocalStore(kv: KeyValueStore): LocalStore {
  const read = async (ref: string) => (await kv.get(KEY_PREFIX + ref)) as LocalAsset | undefined

  return {
    get: read,
    put: (ref, asset) => kv.set(KEY_PREFIX + ref, asset),
    async markRemote(ref) {
      const asset = await read(ref)
      if (asset && !asset.remote) await kv.set(KEY_PREFIX + ref, { ...asset, remote: true })
    },
    remove: (ref) => kv.del(KEY_PREFIX + ref),
    async refs() {
      const all = await kv.keys()
      // W tej samej bazie leżą też inne klucze aplikacji (baza SQL, kopia robocza).
      return all.filter((key): key is string => typeof key === 'string' && key.startsWith(KEY_PREFIX)).map((key) => key.slice(KEY_PREFIX.length))
    },
  }
}

// Magazyn aplikacji - ta sama baza idb-keyval, której używa `src/db/client.ts`.
export const localStore: LocalStore = createLocalStore({ get, set, del, keys })

export default localStore
