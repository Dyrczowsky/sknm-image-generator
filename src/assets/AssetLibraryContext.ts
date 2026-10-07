import { createContext, useContext } from 'react'
import type { AssetLibrary } from './useAssetLibrary'

// `null` = brak biblioteki (niezalogowany albo Supabase nieskonfigurowany).
export const AssetLibraryContext = createContext<AssetLibrary | null>(null)

export const useAssetLibraryContext = (): AssetLibrary | null => useContext(AssetLibraryContext)
