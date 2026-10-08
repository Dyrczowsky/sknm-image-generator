import type { EditorSnapshot, SnapshotPhoto } from '../snapshot/snapshot'

// Grafiki, których przy otwieraniu nie udało się wczytać (brak sieci, brak
// pliku). W edytorze ich nie ma, więc snapshot liczony ze stanu edytora by je
// zgubił - a autozapis usunąłby je z projektu. Dopóki użytkownik sam ich nie
// porzuci, są dopisywane z powrotem do każdego zapisywanego snapshotu.
export interface MissingAssets {
  refs: readonly string[]
  // Snapshot, z którego pochodzą - pamięta ich miejsce i kadr.
  source: EditorSnapshot
}

const samePhoto = (a: SnapshotPhoto, b: SnapshotPhoto) => a.asset === b.asset && a.x === b.x && a.y === b.y

// Lista z brakującymi pozycjami z `source`. Nietknięta lista (to, co zostało
// po odjęciu brakujących) wraca w pierwotnej kolejności; zmieniona dostaje
// brakujące na końcu.
function retainList<T>(current: readonly T[], source: readonly T[], isMissing: (item: T) => boolean, same: (a: T, b: T) => boolean): T[] {
  const lost = source.filter(isMissing)
  if (lost.length === 0) return [...current]
  const kept = source.filter((item) => !isMissing(item))
  const untouched = kept.length === current.length && kept.every((item, i) => same(item, current[i]))
  return untouched ? [...source] : [...current, ...lost]
}

// Snapshot do zapisu: stan edytora plus grafiki, których nie udało się wczytać.
export function retainMissing(current: EditorSnapshot, missing: MissingAssets | null): EditorSnapshot {
  if (!missing || missing.refs.length === 0) return current
  const lostRefs = new Set(missing.refs)
  const { source } = missing

  const graphics = retainList(current.form.graphics, source.form.graphics, (ref) => lostRefs.has(ref), Object.is)
  const photos: Record<string, SnapshotPhoto[]> = {}
  for (const fieldKey of new Set([...Object.keys(current.form.photos), ...Object.keys(source.form.photos)])) {
    photos[fieldKey] = retainList(current.form.photos[fieldKey] ?? [], source.form.photos[fieldKey] ?? [], (photo) => lostRefs.has(photo.asset), samePhoto)
  }
  return { ...current, form: { ...current.form, graphics, photos } }
}
