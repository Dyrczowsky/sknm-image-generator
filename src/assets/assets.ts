import type { SupabaseClient } from '@supabase/supabase-js'
import { isAssetRef, mimeOfRef, refFor } from './hash'
import { localStore } from './localStore'
import type { LocalStore } from './localStore'
import { ImageImportError, MAX_ASSET_BYTES, prepareImage, tooLargeError } from './prepare'
import { register, srcOf } from './registry'
import { downloadAsset, uploadAsset } from './remoteStore'

// Wgrane grafiki (zdjęcia, logotypy w stopce). Stan edytora trzyma je jako
// data URL - tak jak przed tą zmianą - a ten moduł daje każdej nazwę
// `<sha256>.<rozszerzenie>`, przechowuje bajty w przeglądarce i wgrywa je do
// Storage. Snapshot projektu zawiera same nazwy; `registry` tłumaczy je na
// data URL i z powrotem.

// Pole, w którym grafikę dodano: stopka (logo) albo galeria zdjęć (photo).
export type AssetKind = 'logo' | 'photo'

export interface UploadedAsset {
  ref: string
  kind: AssetKind
  name: string
}

// Zależności podmieniane w testach (bez IndexedDB i canvasa).
export interface AssetDeps {
  local: LocalStore
  prepare: (file: File) => Promise<Blob>
  toDataUrl: (blob: Blob, mime: string) => Promise<string>
}

// Grafika z lokalnej kopii, której Storage nie przyjmie, bo jest za duża.
// Nowe pliki zatrzymuje `importImage`; ten błąd dotyczy grafik zapisanych
// lokalnie, zanim ten limit był sprawdzany. `message` trafia do użytkownika.
export class AssetTooLargeError extends Error {
  readonly ref: string

  constructor(ref: string, fileName: string) {
    const which = fileName ? `Grafika „${fileName}"` : 'Jedna z grafik na plakacie'
    super(`${which} jest za duża (limit to ${MAX_ASSET_BYTES / (1024 * 1024)} MB), więc projektu nie da się zapisać w chmurze. Usuń ją z plakatu albo wgraj mniejszą wersję.`)
    this.name = 'AssetTooLargeError'
    this.ref = ref
  }
}

// Odpowiedź Storage "plik przekracza limit kubełka" (HTTP 413, czasem HTTP 400
// z kodem 413 w treści).
function isTooLargeUpload(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { status, statusCode, code, message } = error as { status?: unknown; statusCode?: unknown; code?: unknown; message?: unknown }
  return (
    status === 413 ||
    String(statusCode ?? '') === '413' ||
    code === 'EntityTooLarge' ||
    /exceeded the maximum allowed size|too large/i.test(typeof message === 'string' ? message : '')
  )
}

// Komunikat po nieudanym dodaniu grafiki do biblioteki: błędy typowane (za duży
// plik, zły format) mówią same, co jest nie tak; reszta to zwykle sieć.
export function libraryErrorMessage(error: unknown, fileName: string): string {
  if (error instanceof AssetTooLargeError || error instanceof ImageImportError) return error.message
  return `Nie udało się dodać „${fileName}" do biblioteki. Sprawdź połączenie i spróbuj ponownie.`
}

// Komunikat, gdy dodawana grafika jest już w bibliotece (zamiast cichego końca).
export function alreadyInLibraryMessage(fileName: string, kind: AssetKind): string {
  return `„${fileName}" jest już w bibliotece${kind === 'photo' ? ' jako zdjęcie' : ''}.`
}

const BASE64_CHUNK = 0x8000

// Data URL w base64 z jawnie podanym typem MIME. Plakat wpisuje adres obrazu
// do `url(...)` bez cudzysłowów, a eksport pomija osadzanie tylko dla data
// URL - dlatego nigdy nie zwracamy adresów blob:, podpisanych ani publicznych.
export async function blobToDataUrl(blob: Blob, mime: string): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    // Typ bloba z IndexedDB albo Storage bywa pusty - nadajemy go z nazwy.
    const typed = blob.type === mime ? blob : new Blob([blob], { type: mime })
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error ?? new Error('read failed'))
      reader.readAsDataURL(typed)
    })
  }
  // Poza przeglądarką (testy w node) nie ma FileReadera.
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK))
  return `data:${mime};base64,${btoa(binary)}`
}

const defaultDeps: AssetDeps = { local: localStore, prepare: prepareImage, toDataUrl: blobToDataUrl }

// Przyjmuje plik wybrany przez użytkownika: zmniejsza, nadaje nazwę, zapisuje
// lokalnie i rejestruje. Zwraca data URL - to, co pola formularza dostawały
// dotąd z `readAsDataUrl`.
export async function importImage(file: File, kind: AssetKind, deps: AssetDeps = defaultDeps): Promise<string> {
  const blob = await deps.prepare(file)
  // `prepare` pilnuje tego samo; tu jest granica magazynu, więc sprawdzamy
  // jeszcze raz, niezależnie od tego, kto przygotował plik.
  if (blob.size > MAX_ASSET_BYTES) throw tooLargeError(file.name)
  const ref = await refFor(await blob.arrayBuffer(), blob.type)

  // Ta sama grafika wgrana drugi raz: zostaje istniejący wpis, żeby nie zgubić
  // znacznika `remote` i nie wgrywać jej ponownie. Wyjątek: jeśli nie trafiła
  // jeszcze do Storage, wygrywa rodzaj wybrany teraz - to z niego powstanie
  // wiersz biblioteki (`ensureUploaded`), więc zdjęcie dodane potem jako
  // logotyp ma trafić do logotypów. Wgrana już grafika ma swój wiersz.
  const existing = await deps.local.get(ref)
  if (!existing) await deps.local.put(ref, { blob, remote: false, kind, name: file.name })
  else if (!existing.remote && existing.kind !== kind) await deps.local.put(ref, { ...existing, kind })

  const known = srcOf(ref)
  if (known) return known
  const dataUrl = await deps.toDataUrl(blob, mimeOfRef(ref))
  register(ref, dataUrl)
  return dataUrl
}

async function resolve(ref: string, client: SupabaseClient | null, deps: AssetDeps): Promise<boolean> {
  if (srcOf(ref) !== undefined) return true
  if (!isAssetRef(ref)) return false

  // Cokolwiek się tu nie uda (IndexedDB, sieć, odczyt bloba), kosztuje tylko
  // tę grafikę: `hydrate` nigdy nie odrzuca, bo od niego zależy start edytora.
  try {
    let blob: Blob | undefined
    try {
      blob = (await deps.local.get(ref))?.blob
    } catch {
      // Kopii lokalnej nie da się odczytać - zostaje jeszcze Storage.
    }
    if (!blob && client) {
      // Brak pliku, brak dostępu albo brak sieci: wyjątek, grafika nierozwiązana.
      blob = await downloadAsset(client, ref)
      // Nazwa to skrót treści, ale Storage tego nie pilnuje - każdy członek może
      // wgrać dowolne bajty pod cudzą nazwą. Plik o innym skrócie odrzucamy.
      if ((await refFor(await blob.arrayBuffer(), mimeOfRef(ref))) !== ref) return false
      try {
        // Pobrana grafika jest już w Storage i w bibliotece, więc `kind` i `name`
        // nie będą nigdzie użyte; wpis służy tylko jako lokalna kopia bajtów.
        await deps.local.put(ref, { blob, remote: true, kind: 'photo', name: '' })
      } catch {
        // Brak miejsca: grafika jest sprawdzona i działa w tej sesji, tylko
        // następnym razem zostanie pobrana ponownie.
      }
    }
    if (!blob) return false

    register(ref, await deps.toDataUrl(blob, mimeOfRef(ref)))
    return true
  } catch {
    return false
  }
}

// Sprawia, że każdą z podanych nazw da się zamienić na data URL przez `srcOf`:
// najpierw rejestr, potem kopia lokalna, na końcu Storage (gdy jest klient).
// Zwraca nazwy, których nie udało się odnaleźć albo wczytać. Nie odrzuca.
export async function hydrate(refs: string[], client: SupabaseClient | null, deps: AssetDeps = defaultDeps): Promise<string[]> {
  const unique = [...new Set(refs)]
  const found = await Promise.all(unique.map((ref) => resolve(ref, client, deps)))
  return unique.filter((_, i) => !found[i])
}

// Wgrywa do Storage grafiki, których tam jeszcze nie ma. `onUploaded` dostaje
// każdą świeżo wgraną - tak trafiają do wspólnej biblioteki.
export async function ensureUploaded(
  refs: string[],
  client: SupabaseClient,
  onUploaded?: (asset: UploadedAsset) => Promise<void> | void,
  deps: AssetDeps = defaultDeps,
): Promise<void> {
  for (const ref of new Set(refs)) {
    const asset = await deps.local.get(ref)
    if (!asset) throw new Error(`Brak lokalnej kopii grafiki: ${ref}`)
    if (asset.remote) continue

    // Storage i tak by ją odrzucił - bez wysyłania megabajtów przy każdej próbie.
    if (asset.blob.size > MAX_ASSET_BYTES) throw new AssetTooLargeError(ref, asset.name)
    try {
      await uploadAsset(client, ref, asset.blob)
    } catch (error) {
      if (isTooLargeUpload(error)) throw new AssetTooLargeError(ref, asset.name)
      throw error
    }
    // Znacznik dopiero po `onUploaded`: gdy wpis do biblioteki się nie uda,
    // następna próba wgra plik jeszcze raz (409 = sukces) i powtórzy wpis.
    await onUploaded?.({ ref, kind: asset.kind, name: asset.name })
    await deps.local.markRemote(ref)
  }
}

// Usuwa lokalne kopie grafik, których nie ma na liście - ale tylko te, które
// są już w Storage. Niewgrana grafika może należeć do roboczej wersji w innej
// karcie i nie ma jej skąd odtworzyć.
export async function gcLocal(keepRefs: string[], deps: AssetDeps = defaultDeps): Promise<void> {
  const keep = new Set(keepRefs)
  const stale = (await deps.local.refs()).filter((ref) => !keep.has(ref))
  await Promise.all(
    stale.map(async (ref) => {
      if ((await deps.local.get(ref))?.remote) await deps.local.remove(ref)
    }),
  )
}
