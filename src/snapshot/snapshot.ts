import { EMPTY_FORM, textFieldsOf } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS, normalizeExportSettings } from '../posters/formats'
import type { ExportSettings } from '../posters/formats'
import { MAX_GRAPHICS } from '../posters/theme'
import { FORM_TEXT_FIELDS } from '../types'
import type { DraftRow, FieldVisibility, FormTextField, FormValues, HistoryEntry, ListItem, PhotoValue, PosterLang } from '../types'

// Pełny, wersjonowany opis wszystkiego, co wpływa na plakat. Ten sam kształt
// trzymają lokalna kopia robocza, projekty w chmurze i wpisy historii.
// Obrazów tu nie ma: zamiast data URL-i są refy do magazynu grafik
// (`<sha256>.<jpg|png|svg>`), więc snapshot jest małym JSON-em.
export const SNAPSHOT_VERSION = 1

export interface SnapshotPhoto {
  asset: string
  x: number
  y: number
}

// Formularz z obrazami zastąpionymi przez refy. Typ wynika z `FormValues`,
// więc nowe pole formularza nie skompiluje się, dopóki nie obsłuży go
// `parseForm` niżej.
export type SnapshotForm = Omit<FormValues, 'graphics' | 'photos'> & {
  graphics: string[]
  photos: Record<string, SnapshotPhoto[]>
}

export interface EditorSnapshot {
  v: 1
  poster_key: string
  color_scheme: string | null
  lang: PosterLang
  export: ExportSettings
  form: SnapshotForm
}

// Stan edytora w kształcie, w jakim trzymają go hooki (obrazy jako data URL-e).
export interface EditorState {
  posterKey: string
  colorScheme: string | null
  lang: PosterLang
  exportSettings: ExportSettings
  form: FormValues
}

export type ParseResult =
  | { ok: true; snapshot: EditorSnapshot }
  | { ok: false; reason: 'newer' | 'unknownLayout' | 'invalid' }

// Zakres suwaków rozmiaru - ten sam co w forms/ScaleSlider.tsx (70%-130%).
const MIN_SCALE = 0.7
const MAX_SCALE = 1.3
// Kadr zdjęcia w procentach; nowe zdjęcie zaczyna na środku (patrz `addPhoto`).
const PHOTO_CENTER = 50

const DEFAULT_LANG: PosterLang = 'pl'

// --- Stan edytora <-> snapshot ---

// Ref nadaje się do zapisu tylko jako niepusty tekst, który nie jest data
// URL-em - obraz nie może trafić do wiersza w bazie żadną drogą.
const isAssetRef = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && !/^\s*data:/i.test(value)

// Wołane przy każdej edycji, więc bez kopiowania tego, co się nie zmienia:
// obrazy są zamieniane na refy przez `refOf` (zwykłe odczytanie z rejestru),
// reszta formularza przechodzi przez referencję. Obraz bez refa wypada.
export function toSnapshot(state: EditorState, refOf: (dataUrl: string) => string | undefined): EditorSnapshot {
  const { form } = state
  const assetOf = (src: string): string | undefined => {
    const ref = refOf(src)
    return isAssetRef(ref) ? ref : undefined
  }
  const photos: Record<string, SnapshotPhoto[]> = {}
  for (const [fieldKey, gallery] of Object.entries(form.photos)) {
    const entries: SnapshotPhoto[] = []
    for (const photo of gallery) {
      const asset = assetOf(photo.src)
      if (asset !== undefined) entries.push({ asset, x: photo.x, y: photo.y })
    }
    photos[fieldKey] = entries
  }
  return {
    v: SNAPSHOT_VERSION,
    poster_key: state.posterKey,
    color_scheme: state.colorScheme,
    lang: state.lang,
    export: state.exportSettings,
    form: {
      ...form,
      graphics: form.graphics.map(assetOf).filter((ref) => ref !== undefined),
      photos,
    },
  }
}

// Refy, których `srcOf` nie zna (grafika jeszcze nie pobrana albo usunięta),
// wypadają z formularza i wracają w `missing` - wołający decyduje, czy je
// dociągnąć, czy ostrzec użytkownika.
export function fromSnapshot(snapshot: EditorSnapshot, srcOf: (ref: string) => string | undefined): EditorState & { missing: string[] } {
  const missing = new Set<string>()
  const resolve = (ref: string): string | undefined => {
    const src = srcOf(ref)
    if (src === undefined) missing.add(ref)
    return src
  }
  const { form } = snapshot
  const graphics = form.graphics.map(resolve).filter((src) => src !== undefined)
  const photos: Record<string, PhotoValue[]> = {}
  for (const [fieldKey, gallery] of Object.entries(form.photos)) {
    const entries: PhotoValue[] = []
    for (const photo of gallery) {
      const src = resolve(photo.asset)
      if (src !== undefined) entries.push({ src, x: photo.x, y: photo.y })
    }
    photos[fieldKey] = entries
  }
  return {
    posterKey: snapshot.poster_key,
    colorScheme: snapshot.color_scheme,
    lang: snapshot.lang,
    exportSettings: snapshot.export,
    form: { ...form, graphics, photos },
    missing: [...missing],
  }
}

// --- Walidacja niezaufanego JSON-a ---

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value)

const textOr = (value: unknown, fallback: string): string => (typeof value === 'string' ? value : fallback)
const flagOr = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback)

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const numberOr = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback

// Ukryte pole to `false`, widoczne to brak klucza (jak w `setFieldVisible`).
function parseVisibility(raw: unknown): FieldVisibility {
  if (!isObject(raw)) return {}
  const visibility: FieldVisibility = {}
  for (const name of FORM_TEXT_FIELDS) {
    if (Object.hasOwn(raw, name) && raw[name] === false) visibility[name] = false
  }
  return visibility
}

function parseGraphics(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter(isAssetRef).slice(0, MAX_GRAPHICS) : []
}

function parsePhoto(raw: unknown): SnapshotPhoto | undefined {
  if (!isObject(raw) || !isAssetRef(raw.asset)) return undefined
  return {
    asset: raw.asset,
    x: numberOr(raw.x, PHOTO_CENTER, 0, 100),
    y: numberOr(raw.y, PHOTO_CENTER, 0, 100),
  }
}

// Słownik list pod kluczami pól. `Object.fromEntries` definiuje własności
// wprost, więc klucz `__proto__` z JSON-a nie podmieni prototypu.
function parseRecordOfLists<T>(raw: unknown, parseItem: (item: unknown) => T | undefined): Record<string, T[]> {
  if (!isObject(raw)) return {}
  const entries: [string, T[]][] = []
  for (const [fieldKey, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue
    entries.push([fieldKey, list.map(parseItem).filter((item) => item !== undefined)])
  }
  return Object.fromEntries(entries)
}

function parseListItem(raw: unknown): ListItem | undefined {
  if (!isObject(raw)) return undefined
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
}

// Literał bez rozsmarowywania wejścia: każde pole jest wymienione, a brakujące
// lub źle otypowane bierze wartość z EMPTY_FORM.
function parseForm(raw: unknown): SnapshotForm {
  const source: Json = isObject(raw) ? raw : {}
  const text = (name: FormTextField): string => textOr(source[name], EMPTY_FORM[name])
  return {
    title: text('title'),
    subtitle: text('subtitle'),
    speaker: text('speaker'),
    event_date: text('event_date'),
    event_time: text('event_time'),
    location: text('location'),
    badge: text('badge'),
    badge2: text('badge2'),
    body: text('body'),
    visibility: parseVisibility(source.visibility),
    graphics: parseGraphics(source.graphics),
    showPkLogo: flagOr(source.showPkLogo, EMPTY_FORM.showPkLogo),
    qrUrl: textOr(source.qrUrl, EMPTY_FORM.qrUrl),
    photos: parseRecordOfLists(source.photos, parsePhoto),
    lists: parseRecordOfLists(source.lists, parseListItem),
    titleScale: numberOr(source.titleScale, EMPTY_FORM.titleScale, MIN_SCALE, MAX_SCALE),
    textScale: numberOr(source.textScale, EMPTY_FORM.textScale, MIN_SCALE, MAX_SCALE),
    scaleLinked: flagOr(source.scaleLinked, EMPTY_FORM.scaleLinked),
  }
}

const parseLang = (raw: unknown): PosterLang => (raw === 'en' || raw === 'pl' ? raw : DEFAULT_LANG)

const parseColorScheme = (raw: unknown): string | null => (typeof raw === 'string' && raw.length > 0 ? raw : null)

// Sprawdza snapshot z bazy (jsonb w Supabase, IndexedDB). Odmawia tylko tam,
// gdzie zgadywanie zniszczyłoby dane: nowsza wersja albo nieznany layout
// wczytane „na siłę" zostałyby zaraz nadpisane przez autozapis. Wszystko inne
// jest naprawiane wartościami domyślnymi.
export function parseSnapshot(raw: unknown, knownLayouts: readonly string[]): ParseResult {
  if (!isObject(raw)) return { ok: false, reason: 'invalid' }
  const { v, poster_key: posterKey } = raw
  if (typeof v !== 'number') return { ok: false, reason: 'invalid' }
  // Wersja idzie pierwsza: nowszy zapis może mieć inny kształt reszty pól.
  if (v > SNAPSHOT_VERSION) return { ok: false, reason: 'newer' }
  if (v !== SNAPSHOT_VERSION) return { ok: false, reason: 'invalid' }
  if (typeof posterKey !== 'string' || posterKey.length === 0) return { ok: false, reason: 'invalid' }
  if (!knownLayouts.includes(posterKey)) return { ok: false, reason: 'unknownLayout' }
  return {
    ok: true,
    snapshot: {
      v: SNAPSHOT_VERSION,
      poster_key: posterKey,
      color_scheme: parseColorScheme(raw.color_scheme),
      lang: parseLang(raw.lang),
      export: normalizeExportSettings(raw.export),
      form: parseForm(raw.form),
    },
  }
}

// --- Pytania o snapshot ---

// Refy wszystkich obrazów snapshotu (grafiki stopki, potem zdjęcia), bez
// powtórzeń - do wysyłki do magazynu i do pobrania przy otwieraniu.
export function assetRefsOf(snapshot: EditorSnapshot): string[] {
  const refs = new Set(snapshot.form.graphics)
  for (const gallery of Object.values(snapshot.form.photos)) {
    for (const photo of gallery) refs.add(photo.asset)
  }
  return [...refs]
}

const hasText = (value: string): boolean => value.trim().length > 0

// Czy użytkownik nie wpisał nic, czego szkoda byłoby stracić: żadnego tekstu,
// obrazu, wpisu listy ani kodu QR. Szablon, kolory, język, widoczność pól,
// suwaki i ustawienia eksportu się nie liczą - odtwarza się je jednym kliknięciem.
export function isBlank(snapshot: EditorSnapshot): boolean {
  const { form } = snapshot
  if (FORM_TEXT_FIELDS.some((name) => hasText(form[name]))) return false
  if (hasText(form.qrUrl)) return false
  if (form.graphics.length > 0) return false
  if (Object.values(form.photos).some((gallery) => gallery.length > 0)) return false
  // Dodany, ale niewypełniony wiersz listy to jeszcze nie treść.
  return !Object.values(form.lists).some((items) => items.some((item) => Object.values(item).some(hasText)))
}

// --- Stare zapisy (sprzed snapshotów) ---

function legacySnapshot(
  posterKey: string,
  colorScheme: string | null | undefined,
  lang: PosterLang,
  fields: Partial<SnapshotForm>,
): EditorSnapshot {
  return {
    v: SNAPSHOT_VERSION,
    poster_key: posterKey,
    color_scheme: parseColorScheme(colorScheme),
    lang,
    export: { ...DEFAULT_EXPORT_SETTINGS },
    // Przez parser: świeże kopie wartości domyślnych zamiast obiektów EMPTY_FORM.
    form: parseForm(fields),
  }
}

// Wpis historii sprzed snapshotów: sześć pól tekstowych, layout i kolory.
// Reszty (grafik, list, suwaków, ustawień eksportu) nigdy nie zapisano.
export function snapshotFromLegacyHistory(entry: HistoryEntry, lang: PosterLang): EditorSnapshot {
  return legacySnapshot(entry.poster_key, entry.color_scheme, lang, textFieldsOf(entry))
}

// Kolumna `draft.visibility` to JSON; zły / pusty wpis → brak ograniczeń.
function visibilityFromJson(raw: string | null): FieldVisibility {
  if (!raw) return {}
  try {
    return parseVisibility(JSON.parse(raw))
  } catch {
    return {}
  }
}

// Lokalny draft z SQLite: dziewięć pól tekstowych, widoczność i kolory.
// Layout draftu był wskazywany przez lokalne `template_id`, więc klucz
// layoutu podaje wołający.
export function snapshotFromLegacyDraft(row: DraftRow, posterKey: string, lang: PosterLang): EditorSnapshot {
  return legacySnapshot(posterKey, row.color_scheme, lang, {
    ...textFieldsOf(row),
    visibility: visibilityFromJson(row.visibility),
  })
}
