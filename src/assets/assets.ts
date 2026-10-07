import type { SupabaseClient } from '@supabase/supabase-js'
import { isAssetRef, mimeOfRef, refFor } from './hash'
import { localStore } from './localStore'
import type { LocalStore } from './localStore'
import { prepareImage } from './prepare'
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
  const ref = await refFor(await blob.arrayBuffer(), blob.type)

  // Ta sama grafika wgrana drugi raz: zostaje istniejący wpis, żeby nie zgubić
  // znacznika `remote` i nie wgrywać jej ponownie.
  if (!(await deps.local.get(ref))) await deps.local.put(ref, { blob, remote: false, kind, name: file.name })

  const known = srcOf(ref)
  if (known) return known
  const dataUrl = await deps.toDataUrl(blob, mimeOfRef(ref))
  register(ref, dataUrl)
  return dataUrl
}

async function resolve(ref: string, client: SupabaseClient | null, deps: AssetDeps): Promise<boolean> {
  if (srcOf(ref) !== undefined) return true
  if (!isAssetRef(ref)) return false

  let blob = (await deps.local.get(ref))?.blob
  if (!blob && client) {
    try {
      blob = await downloadAsset(client, ref)
    } catch {
      // Brak pliku, brak dostępu albo brak sieci - grafika zostaje nierozwiązana.
      return false
    }
    // Pobrana grafika jest już w Storage i w bibliotece, więc `kind` i `name`
    // nie będą nigdzie użyte; wpis służy tylko jako lokalna kopia bajtów.
    await deps.local.put(ref, { blob, remote: true, kind: 'photo', name: '' })
  }
  if (!blob) return false

  register(ref, await deps.toDataUrl(blob, mimeOfRef(ref)))
  return true
}

// Sprawia, że każdą z podanych nazw da się zamienić na data URL przez `srcOf`:
// najpierw rejestr, potem kopia lokalna, na końcu Storage (gdy jest klient).
// Zwraca nazwy, których nie udało się odnaleźć.
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

    await uploadAsset(client, ref, asset.blob)
    // Znacznik dopiero po `onUploaded`: gdy wpis do biblioteki się nie uda,
    // następna próba wgra plik jeszcze raz (409 = sukces) i powtórzy wpis.
    await onUploaded?.({ ref, kind: asset.kind, name: asset.name })
    await deps.local.markRemote(ref)
  }
}

// Usuwa lokalne kopie grafik, których nie ma na liście.
export async function gcLocal(keepRefs: string[], deps: AssetDeps = defaultDeps): Promise<void> {
  const keep = new Set(keepRefs)
  const stale = (await deps.local.refs()).filter((ref) => !keep.has(ref))
  await Promise.all(stale.map((ref) => deps.local.remove(ref)))
}
