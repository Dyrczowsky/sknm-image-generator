import { describe, expect, it } from 'vitest'
import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS } from '../posters/formats'
import { assetRefsOf, fromSnapshot, toSnapshot } from '../snapshot/snapshot'
import type { EditorSnapshot, SnapshotForm } from '../snapshot/snapshot'
import { retainMissing } from './missingAssets'

const A = `${'a'.repeat(64)}.png`
const B = `${'b'.repeat(64)}.jpg`
const C = `${'c'.repeat(64)}.svg`
const D = `${'d'.repeat(64)}.png`

const snapshot = (form: Partial<SnapshotForm>): EditorSnapshot => ({
  v: 1, poster_key: 'gosc', color_scheme: null, lang: 'pl', export: DEFAULT_EXPORT_SETTINGS,
  form: { ...EMPTY_FORM, graphics: [], photos: {}, ...form },
})

// Stan edytora po otwarciu `source`, gdy `known` to jedyne wczytane grafiki -
// tak jak robi to workspace: fromSnapshot → edytor → toSnapshot.
function opened(source: EditorSnapshot, known: string[]) {
  const srcOf = (ref: string) => (known.includes(ref) ? `data:${ref}` : undefined)
  const state = fromSnapshot(source, srcOf)
  const current = toSnapshot(state, (src) => src.slice('data:'.length))
  return { current, missing: { refs: state.missing, source } }
}

describe('retainMissing', () => {
  it('bez brakujących grafik oddaje ten sam snapshot', () => {
    const current = snapshot({ graphics: [A] })
    expect(retainMissing(current, null)).toBe(current)
    expect(retainMissing(current, { refs: [], source: snapshot({ graphics: [A, B] }) })).toBe(current)
  })

  it('nietknięty stan po otwarciu daje dokładnie otwarty snapshot (kolejność i kadr)', () => {
    const source = snapshot({ title: 'Gość', graphics: [A, B, C], photos: { speaker: [{ asset: D, x: 10, y: 20 }, { asset: A, x: 30, y: 40 }] } })
    const { current, missing } = opened(source, [A, C])
    expect(assetRefsOf(current)).toEqual([A, C])
    expect(retainMissing(current, missing)).toEqual(source)
  })

  it('zmiana tekstu nie gubi brakujących grafik', () => {
    const source = snapshot({ graphics: [A, B], photos: { speaker: [{ asset: D, x: 10, y: 20 }] } })
    const { current, missing } = opened(source, [A])
    const edited = { ...current, form: { ...current.form, title: 'Nowy tytuł' } }
    const result = retainMissing(edited, missing)
    expect(result.form.title).toBe('Nowy tytuł')
    expect(result.form.graphics).toEqual([A, B])
    expect(result.form.photos).toEqual({ speaker: [{ asset: D, x: 10, y: 20 }] })
  })

  it('zmieniona lista dostaje brakujące na końcu', () => {
    const source = snapshot({ graphics: [B, A], photos: { speaker: [{ asset: D, x: 10, y: 20 }, { asset: A, x: 50, y: 50 }] } })
    const { current, missing } = opened(source, [A])
    const edited: EditorSnapshot = {
      ...current,
      form: { ...current.form, graphics: [A, C], photos: { speaker: [{ asset: A, x: 0, y: 0 }] } },
    }
    const result = retainMissing(edited, missing)
    expect(result.form.graphics).toEqual([A, C, B])
    expect(result.form.photos.speaker).toEqual([{ asset: A, x: 0, y: 0 }, { asset: D, x: 10, y: 20 }])
  })

  it('usunięcie wszystkich wczytanych grafik zostawia same brakujące', () => {
    const source = snapshot({ graphics: [A, B] })
    const { current, missing } = opened(source, [A])
    expect(retainMissing({ ...current, form: { ...current.form, graphics: [] } }, missing).form.graphics).toEqual([B])
  })

  it('galeria, której nie ma w bieżącym stanie, wraca z brakującymi zdjęciami', () => {
    const source = snapshot({ photos: { speaker: [{ asset: D, x: 1, y: 2 }] } })
    const result = retainMissing(snapshot({ photos: {} }), { refs: [D], source })
    expect(result.form.photos).toEqual({ speaker: [{ asset: D, x: 1, y: 2 }] })
  })

  it('galerie dodane po otwarciu zostają bez zmian', () => {
    const source = snapshot({ graphics: [B] })
    const result = retainMissing(snapshot({ photos: { hero: [{ asset: A, x: 5, y: 5 }] } }), { refs: [B], source })
    expect(result.form.photos).toEqual({ hero: [{ asset: A, x: 5, y: 5 }] })
    expect(result.form.graphics).toEqual([B])
  })

  it('nie zmienia wejścia', () => {
    const source = snapshot({ graphics: [A, B] })
    const { current, missing } = opened(source, [A])
    const before = JSON.stringify(current)
    retainMissing(current, missing)
    expect(JSON.stringify(current)).toBe(before)
    expect(source.form.graphics).toEqual([A, B])
  })
})
