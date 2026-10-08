import { useState } from 'react'
import { requireSupabase } from '../supabase/client'
import { useRemoteList } from '../supabase/useRemoteList'
import { ensureUploaded, hydrate } from './assets'
import type { AssetKind, UploadedAsset } from './assets'
import { listAssets, registerAsset, removeAsset, renameAsset } from './remoteLibrary'
import type { LibraryAsset } from './remoteLibrary'

const loadAssets = () => listAssets(requireSupabase())

// Wspólna biblioteka grafik - aktywna tylko po zalogowaniu (`member` = zalogowana
// osoba albo `null`). Nieudana zmiana zostawia listę bez zmian i ustawia `actionError`.
export function useAssetLibrary(member: string | null) {
  const list = useRemoteList(member, loadAssets)
  const [actionError, setActionError] = useState<string | null>(null)

  const run = async (action: () => Promise<void>, apply: (assets: LibraryAsset[]) => LibraryAsset[]): Promise<boolean> => {
    setActionError(null)
    try {
      await action()
      list.setItems(apply)
      return true
    } catch {
      setActionError('Nie udało się zapisać zmiany. Spróbuj ponownie.')
      return false
    }
  }

  const rename = (ref: string, name: string) =>
    run(
      () => renameAsset(requireSupabase(), ref, name),
      (assets) => assets.map((asset) => (asset.ref === ref ? { ...asset, name } : asset)),
    )

  const remove = (ref: string) =>
    run(
      () => removeAsset(requireSupabase(), ref),
      (assets) => assets.filter((asset) => asset.ref !== ref),
    )

  // Pasuje do `onUploaded` z `ensureUploaded`: błąd rejestracji leci dalej
  // (wgranie zostanie powtórzone), a udana grafika trafia na początek listy.
  const register = async (asset: UploadedAsset): Promise<void> => {
    const client = requireSupabase()
    await registerAsset(client, asset)
    list.setItems((assets) => {
      if (assets.some((a) => a.ref === asset.ref)) return assets
      const added: LibraryAsset = { ...asset, created_at: new Date().toISOString(), author_email: member ?? '' }
      return [added, ...assets]
    })
  }

  // Wgrywa do Storage grafikę zaimportowaną już lokalnie (`importImage`) i wpisuje
  // ją do biblioteki z rodzajem wybranym przez użytkownika. Rzuca przy porażce.
  const upload = async (ref: string, kind: AssetKind, name: string): Promise<void> => {
    let registered = false
    await ensureUploaded([ref], requireSupabase(), async (asset) => {
      await register(asset)
      registered = true
    })
    // Wgrana wcześniej z tej przeglądarki, a potem usunięta z biblioteki.
    if (!registered) await register({ ref, kind, name })
  }

  // Dociąga miniatury do rejestru; formularz nie musi znać klienta Supabase.
  const loadThumbs = async (refs: string[]): Promise<void> => {
    await hydrate(refs, requireSupabase())
  }

  return { status: list.status, items: list.items, reload: list.reload, actionError, rename, remove, register, upload, loadThumbs }
}

export type AssetLibrary = ReturnType<typeof useAssetLibrary>
