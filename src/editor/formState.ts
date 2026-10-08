import { FORM_TEXT_FIELDS } from '../types'
import type { FormTextField, FormUpdate, FormValues } from '../types'
import { MAX_GRAPHICS } from '../posters/theme'

// Stan pustego formularza: wartości domyślne, a także tło, na którym parser
// snapshotu uzupełnia brakujące pola. Każde pole `FormValues` trafia do
// snapshotu (`src/snapshot/snapshot.ts`) - kopii roboczej, projektu i wpisu
// historii; nowe pole trzeba tam obsłużyć w `parseForm`, inaczej kod się nie
// skompiluje, a test obiegu snapshotu padnie.
export const EMPTY_FORM: FormValues = {
  title: '',
  subtitle: '',
  speaker: '',
  event_date: '',
  event_time: '',
  location: '',
  badge: '',
  badge2: '',
  body: '',
  visibility: {},
  graphics: [],
  showPkLogo: true,
  qrUrl: '',
  photos: {},
  lists: {},
  titleScale: 1,
  textScale: 1,
  scaleLinked: true,
}

// Pola tekstowe wiersza bazy (stary draft / wąskie kolumny historii); kolumny, których wiersz nie
// ma, oraz NULL-e dają pusty tekst.
export type TextFieldsRow = Partial<Record<FormTextField, string | null>>

export function textFieldsOf(row: TextFieldsRow): Record<FormTextField, string> {
  return Object.fromEntries(FORM_TEXT_FIELDS.map((name) => [name, row[name] ?? ''])) as Record<FormTextField, string>
}

// Formularz odtworzony z wiersza bazy: pola tekstowe z wiersza, reszta domyślna.
export function formFromRow(row: TextFieldsRow): FormValues {
  return { ...EMPTY_FORM, ...textFieldsOf(row) }
}

// --- Przekształcenia stanu (FormUpdate) ---
// Każda funkcja zwraca przepis „stary formularz → nowy", bez mutacji.

const replaceAt = <T>(items: T[], index: number, change: (item: T) => T): T[] =>
  items.map((item, i) => (i === index ? change(item) : item))

const removeAt = <T>(items: T[], index: number): T[] => items.filter((_, i) => i !== index)

export const setField = (name: FormTextField, value: string): FormUpdate => (form) => ({ ...form, [name]: value })

// Odznaczenie ukrywa pole na plakacie. Widoczne pole to brak klucza, żeby
// snapshot trzymał tylko rzeczywiste wyjątki.
export const setFieldVisible = (name: FormTextField, visible: boolean): FormUpdate => (form) => {
  const visibility = { ...form.visibility }
  if (visible) delete visibility[name]
  else visibility[name] = false
  return { ...form, visibility }
}

export const addGraphics = (srcs: string[]): FormUpdate => (form) => ({
  ...form,
  graphics: [...form.graphics, ...srcs].slice(0, MAX_GRAPHICS),
})

export const removeGraphic = (index: number): FormUpdate => (form) => ({ ...form, graphics: removeAt(form.graphics, index) })

// Zamienia grafikę miejscami z sąsiadem; poza zakresem listy - bez zmian.
export const moveGraphic = (index: number, direction: -1 | 1): FormUpdate => (form) => {
  const target = index + direction
  if (target < 0 || target >= form.graphics.length) return form
  const graphics = [...form.graphics]
  ;[graphics[index], graphics[target]] = [graphics[target], graphics[index]]
  return { ...form, graphics }
}

export const setShowPkLogo = (showPkLogo: boolean): FormUpdate => (form) => ({ ...form, showPkLogo })

export const setQrUrl = (qrUrl: string): FormUpdate => (form) => ({ ...form, qrUrl })

// Galeria zdjęć pod kluczem `fieldKey`. Nowe zdjęcie zaczyna z kadrem na środku.
const updatePhotos = (fieldKey: string, change: (photos: FormValues['photos'][string]) => FormValues['photos'][string]): FormUpdate => (form) => ({
  ...form,
  photos: { ...form.photos, [fieldKey]: change(form.photos[fieldKey] ?? []) },
})

export const addPhoto = (fieldKey: string, src: string): FormUpdate =>
  updatePhotos(fieldKey, (photos) => [...photos, { src, x: 50, y: 50 }])

export const replacePhoto = (fieldKey: string, index: number, src: string): FormUpdate =>
  updatePhotos(fieldKey, (photos) => replaceAt(photos, index, (photo) => ({ ...photo, src })))

export const removePhoto = (fieldKey: string, index: number): FormUpdate =>
  updatePhotos(fieldKey, (photos) => removeAt(photos, index))

export const setPhotoPosition = (fieldKey: string, index: number, position: { x?: number; y?: number }): FormUpdate =>
  updatePhotos(fieldKey, (photos) => replaceAt(photos, index, (photo) => ({ ...photo, ...position })))

// Powtarzalna lista pod kluczem `fieldKey` (np. program konferencji).
const updateList = (fieldKey: string, change: (items: FormValues['lists'][string]) => FormValues['lists'][string]): FormUpdate => (form) => ({
  ...form,
  lists: { ...form.lists, [fieldKey]: change(form.lists[fieldKey] ?? []) },
})

export const addListItem = (fieldKey: string): FormUpdate => updateList(fieldKey, (items) => [...items, {}])

export const setListItemField = (fieldKey: string, index: number, name: string, value: string): FormUpdate =>
  updateList(fieldKey, (items) => replaceAt(items, index, (item) => ({ ...item, [name]: value })))

export const removeListItem = (fieldKey: string, index: number): FormUpdate =>
  updateList(fieldKey, (items) => removeAt(items, index))

// Suwaki rozmiaru. Spięte: przesunięcie jednego ustawia OBA na ten sam
// procent; zapięcie spinacza od razu równa tekst do tytułu, żeby nie zostawić
// suwaków w rozjeździe.
export const setTitleScale = (titleScale: number): FormUpdate => (form) => ({
  ...form,
  titleScale,
  textScale: form.scaleLinked ? titleScale : form.textScale,
})

export const setTextScale = (textScale: number): FormUpdate => (form) => ({
  ...form,
  textScale,
  titleScale: form.scaleLinked ? textScale : form.titleScale,
})

export const setScaleLinked = (scaleLinked: boolean): FormUpdate => (form) => ({
  ...form,
  scaleLinked,
  textScale: scaleLinked ? form.titleScale : form.textScale,
})
