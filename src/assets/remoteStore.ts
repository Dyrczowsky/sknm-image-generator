import type { SupabaseClient } from '@supabase/supabase-js'
import { mimeOfRef } from './hash'

// Prywatny kubełek bez folderów: plik nazywa się tak jak grafika (`<sha256>.<rozszerzenie>`).
export const ASSETS_BUCKET = 'sknm-poster-assets'

// Pola błędu Storage, po których rozpoznajemy "plik już istnieje".
interface StorageErrorLike {
  message?: string
  // Kod HTTP odpowiedzi.
  status?: number
  // Kod z treści odpowiedzi - Storage potrafi odpowiedzieć HTTP 400 z "409" tutaj.
  statusCode?: string | number
  code?: string
}

// Plik o tej nazwie już jest w kubełku. Nazwa to skrót treści, więc leży tam
// dokładnie ta sama grafika (wgrana wcześniej, z innej karty albo przez kogoś
// innego) - nie ma czego wgrywać.
export function isDuplicateUpload(error: StorageErrorLike): boolean {
  return (
    error.status === 409 ||
    String(error.statusCode ?? '') === '409' ||
    error.code === 'ResourceAlreadyExists' ||
    /already exists|duplicate/i.test(error.message ?? '')
  )
}

export async function uploadAsset(client: SupabaseClient, ref: string, blob: Blob): Promise<void> {
  const { error } = await client.storage.from(ASSETS_BUCKET).upload(ref, blob, {
    contentType: mimeOfRef(ref),
    // Pliki są niezmienne - nigdy nie nadpisujemy, a przeglądarka może je trzymać rok.
    upsert: false,
    cacheControl: '31536000',
  })
  if (error && !isDuplicateUpload(error)) throw error
}

export async function downloadAsset(client: SupabaseClient, ref: string): Promise<Blob> {
  const { data, error } = await client.storage.from(ASSETS_BUCKET).download(ref)
  if (error) throw error
  if (!data) throw new Error(`Brak grafiki w Storage: ${ref}`)
  return data
}
