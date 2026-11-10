import { refFor } from '../assets/hash'
import { newHistoryEntry } from '../history/remoteHistory'
import { toSnapshot } from '../snapshot/snapshot'
import type { EditorSnapshot, EditorState } from '../snapshot/snapshot'
import type { NewHistoryEntry } from '../types'
import type { ApiError } from './types'

// Limit `octet_length(snapshot::text)` w bazie.
const MAX_SNAPSHOT_BYTES = 65536

export type SnapshotResult =
  | { ok: true; snapshot: EditorSnapshot; photoRefs: string[]; historyRow: NewHistoryEntry }
  | { ok: false; error: ApiError }

// Data URL `data:<mime>;base64,<dane>` -> typ MIME i surowe bajty.
function decodeDataUrl(src: string): { mime: string; bytes: Uint8Array } {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(src)
  if (!match) throw new Error('Zdjęcie nie jest data URL w base64.')
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { mime: match[1], bytes }
}

// Refy zdjęć liczone z oryginalnych bajtów tym samym `refFor` co w edytorze,
// snapshot bez obrazów (same refy) i wiersz historii.
export async function snapshotFor(state: EditorState): Promise<SnapshotResult> {
  const refByDataUrl = new Map<string, string>()
  const photoRefs: string[] = []
  try {
    for (const photo of state.form.photos.photo ?? []) {
      const { mime, bytes } = decodeDataUrl(photo.src)
      const ref = await refFor(bytes, mime)
      refByDataUrl.set(photo.src, ref)
      photoRefs.push(ref)
    }
  } catch (e) {
    return { ok: false, error: { code: 'photo_not_image', message: e instanceof Error ? e.message : 'Nie można odczytać zdjęcia.' } }
  }
  const snapshot = toSnapshot(state, (src) => refByDataUrl.get(src))
  if (new TextEncoder().encode(JSON.stringify(snapshot)).length > MAX_SNAPSHOT_BYTES) {
    return { ok: false, error: { code: 'too_large', message: `Zapis projektu przekracza ${MAX_SNAPSHOT_BYTES} bajtów. Skróć teksty lub zmniejsz liczbę elementów.` } }
  }
  return { ok: true, snapshot, photoRefs, historyRow: newHistoryEntry(snapshot) }
}
