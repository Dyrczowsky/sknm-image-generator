import { EMPTY_FORM } from '../editor/formState'
import { DEFAULT_EXPORT_SETTINGS, shapeFor } from '../posters/formats'
import { ACCENT_NAMES, accentAllowed, schemesFor } from '../posters/schemes'
import { FORM_TEXT_FIELDS } from '../types'
import type { AccentName, FormTextField, FormValues, ListItem, PhotoValue, PosterShape } from '../types'
import type { EditorState } from '../snapshot/snapshot'
import { encodeScheme } from '../utils/colorScheme'
import { buildCatalog } from './catalog'
import type { ApiError, ApiShape, Catalog } from './types'

export type RenderStateResult =
  | { ok: true; state: EditorState; formatKey: ApiShape; shape: PosterShape }
  | { ok: false; error: ApiError }

const MAX_TEXT = 2000
const MAX_PHOTOS = 6
const MAX_AGENDA = 20
const MIN_SCALE = 0.7
const MAX_SCALE = 1.3
const TOP_LEVEL_KEYS = ['template', 'shape', 'scheme', 'lang', 'fields', 'photos', 'lists', 'options']
const AGENDA_KEYS = ['time', 'title', 'subtitle']
const PK_LOGOS = ['pk', 'wiim', 'kms']
const CIEKAWOSTKA_LAYOUTS = ['zdjecie', 'panorama', 'archiwum']
const BOOLEAN_OPTIONS = ['showPkLogo', 'showSknmLogo', 'wideSubtitle', 'fillAgenda']
// Pola, które zostają widoczne mimo braku wartości (plakat sam decyduje o odznace).
const ALWAYS_VISIBLE: FormTextField[] = ['badge', 'badge2']

// Znaki z prywatnego zakresu Unicode to znaczniki sterujące tekstu sformatowanego.
const CONTROL_MARKS = /[-]/g

let catalog: Catalog | undefined
const getCatalog = (): Catalog => (catalog ??= buildCatalog())

const fail = (code: ApiError['code'], message: string): { ok: false; error: ApiError } => ({ ok: false, error: { code, message } })

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const list = (names: readonly string[]) => names.map((n) => `„${n}"`).join(', ')
const clean = (text: string) => text.replace(CONTROL_MARKS, '')

export function buildRenderState(input: unknown): RenderStateResult {
  if (!isRecord(input)) return fail('bad_request', 'Wejście musi być obiektem JSON.')
  const unknownKey = Object.keys(input).find((k) => !TOP_LEVEL_KEYS.includes(k))
  if (unknownKey !== undefined) return fail('bad_request', `Nieznane pole „${unknownKey}". Dozwolone: ${list(TOP_LEVEL_KEYS)}.`)

  const { template: key } = input
  const templates = getCatalog().templates
  const template = typeof key === 'string' ? templates.find((t) => t.key === key) : undefined
  if (!template || typeof key !== 'string') {
    return fail('unknown_template', `Nieznany szablon ${JSON.stringify(key)}. Dostępne: ${list(templates.map((t) => t.key))}.`)
  }

  // Kształt i język.
  const shapeInput = input.shape ?? 'square'
  if (shapeInput !== 'square' && shapeInput !== 'story') return fail('invalid_field', 'Pole „shape" musi mieć wartość „square" albo „story".')
  const lang = input.lang ?? 'pl'
  if (lang !== 'pl' && lang !== 'en') return fail('invalid_field', 'Pole „lang" musi mieć wartość „pl" albo „en".')

  // Kolorystyka.
  const allowedSchemes = schemesFor(key)
  let colorScheme: string
  if (input.scheme === undefined) {
    colorScheme = encodeScheme(allowedSchemes[0]) as string
  } else {
    if (typeof input.scheme !== 'string') return fail('invalid_scheme', `Pole „scheme" musi być tekstem. Dozwolone: ${list(allowedSchemes)}.`)
    const [scheme, accent, ...rest] = input.scheme.split('~')
    if (!allowedSchemes.includes(scheme) || rest.length > 0) {
      return fail('invalid_scheme', `Schemat ${JSON.stringify(input.scheme)} nie istnieje dla szablonu „${key}". Dozwolone: ${list(allowedSchemes)}.`)
    }
    if (accent !== undefined) {
      const known = ACCENT_NAMES.includes(accent as AccentName)
      if (!known || !accentAllowed(key, scheme, accent as AccentName)) {
        const accents = template.schemes.find((s) => s.name === scheme)?.accents ?? []
        const hint = accents.length > 0 ? `Dozwolone akcenty: ${list(accents)}.` : 'Ten schemat nie ma akcentów.'
        return fail('invalid_scheme', `Akcent ${JSON.stringify(accent)} nie jest dozwolony dla schematu „${scheme}" w szablonie „${key}". ${hint}`)
      }
    }
    colorScheme = input.scheme
  }

  // Pola tekstowe.
  const text: Partial<Record<FormTextField, string>> = {}
  if (input.fields !== undefined) {
    if (!isRecord(input.fields)) return fail('invalid_field', 'Pole „fields" musi być obiektem.')
    const allowed = template.fields.map((f) => f.name as string)
    for (const [name, value] of Object.entries(input.fields)) {
      if (!allowed.includes(name)) return fail('invalid_field', `Pole „${name}" nie występuje w szablonie „${key}". Dozwolone: ${list(allowed)}.`)
      if (typeof value !== 'string') return fail('invalid_field', `Pole „${name}" musi być tekstem.`)
      if (value.length > MAX_TEXT) return fail('invalid_field', `Pole „${name}" jest za długie (${value.length} znaków, maksimum ${MAX_TEXT}).`)
      if (name === 'event_date' && value !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return fail('invalid_field', 'Pole „event_date" musi mieć format RRRR-MM-DD, np. „2026-11-10".')
      }
      if (name === 'event_time' && value !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        return fail('invalid_field', 'Pole „event_time" musi mieć format GG:MM, np. „18:30".')
      }
      text[name as FormTextField] = clean(value)
    }
  }
  // Pominięte (lub puste) pola szablonu są ukryte; widoczne pole to brak klucza.
  const visibility: FormValues['visibility'] = {}
  for (const field of template.fields) {
    if (!ALWAYS_VISIBLE.includes(field.name) && !text[field.name]) visibility[field.name] = false
  }

  // Zdjęcia.
  const photos: Record<string, PhotoValue[]> = {}
  if (input.photos !== undefined) {
    if (!isRecord(input.photos)) return fail('invalid_field', 'Pole „photos" musi być obiektem.')
    const unknownPhotoKey = Object.keys(input.photos).find((k) => k !== 'photo')
    if (unknownPhotoKey !== undefined) return fail('invalid_field', `Nieznana grupa zdjęć „${unknownPhotoKey}". Dozwolona jest tylko „photo".`)
    const given = input.photos.photo
    if (given !== undefined) {
      if (!Array.isArray(given)) return fail('invalid_field', 'Pole „photos.photo" musi być tablicą.')
      if (given.length > 0 && template.photo === null) return fail('invalid_field', `Szablon „${key}" nie ma zdjęć - usuń pole „photos".`)
      if (given.length > MAX_PHOTOS) return fail('too_many_photos', `Za dużo zdjęć (${given.length}), maksimum ${MAX_PHOTOS}.`)
      const parsed: PhotoValue[] = []
      for (const [i, raw] of given.entries()) {
        const at = `photos.photo[${i}]`
        if (!isRecord(raw)) return fail('invalid_field', `Pole „${at}" musi być obiektem.`)
        const { src, x = 50, y = 50, zoom } = raw
        if (typeof src !== 'string' || !/^data:image\/(jpeg|png);base64,/.test(src)) {
          return fail('invalid_field', `Pole „${at}.src" musi być data URL-em JPEG lub PNG (base64).`)
        }
        for (const [axis, v] of [['x', x], ['y', y]] as const) {
          if (typeof v !== 'number' || !(v >= 0 && v <= 100)) return fail('invalid_field', `Pole „${at}.${axis}" musi być liczbą od 0 do 100.`)
        }
        if (zoom !== undefined && (typeof zoom !== 'number' || !(zoom >= 1))) return fail('invalid_field', `Pole „${at}.zoom" musi być liczbą co najmniej 1.`)
        parsed.push({ src, x: x as number, y: y as number, ...(zoom !== undefined && { zoom: zoom as number }) })
      }
      if (parsed.length > 0) photos.photo = parsed
    }
  }

  // Listy.
  const lists: Record<string, ListItem[]> = {}
  if (input.lists !== undefined) {
    if (!isRecord(input.lists)) return fail('invalid_field', 'Pole „lists" musi być obiektem.')
    const unknownList = Object.keys(input.lists).find((k) => k !== 'agenda')
    if (unknownList !== undefined) return fail('invalid_field', `Nieznana lista „${unknownList}". Dozwolona jest tylko „agenda".`)
    const agenda = input.lists.agenda
    if (agenda !== undefined) {
      if (template.lists === null) return fail('invalid_field', `Lista „agenda" jest dostępna tylko w szablonie „konferencja", nie w „${key}".`)
      if (!Array.isArray(agenda)) return fail('invalid_field', 'Pole „lists.agenda" musi być tablicą.')
      if (agenda.length > MAX_AGENDA) return fail('invalid_field', `Za dużo punktów agendy (${agenda.length}), maksimum ${MAX_AGENDA}.`)
      const items: ListItem[] = []
      for (const [i, raw] of agenda.entries()) {
        const at = `lists.agenda[${i}]`
        if (!isRecord(raw)) return fail('invalid_field', `Pole „${at}" musi być obiektem.`)
        const item: ListItem = {}
        for (const [name, value] of Object.entries(raw)) {
          if (!AGENDA_KEYS.includes(name)) return fail('invalid_field', `Pole „${at}.${name}" jest nieznane. Dozwolone: ${list(AGENDA_KEYS)}.`)
          if (typeof value !== 'string') return fail('invalid_field', `Pole „${at}.${name}" musi być tekstem.`)
          if (value.length > MAX_TEXT) return fail('invalid_field', `Pole „${at}.${name}" jest za długie (maksimum ${MAX_TEXT} znaków).`)
          item[name] = clean(value)
        }
        items.push(item)
      }
      lists.agenda = items
    }
  }

  // Opcje.
  const options: Partial<FormValues> = {}
  if (input.options !== undefined) {
    if (!isRecord(input.options)) return fail('invalid_field', 'Pole „options" musi być obiektem.')
    for (const [name, value] of Object.entries(input.options)) {
      if (!template.options.includes(name)) return fail('invalid_field', `Opcja „${name}" nie działa w szablonie „${key}". Dozwolone: ${list(template.options)}.`)
      if (BOOLEAN_OPTIONS.includes(name)) {
        if (typeof value !== 'boolean') return fail('invalid_field', `Opcja „${name}" musi być wartością true/false.`)
        Object.assign(options, { [name]: value })
      } else if (name === 'titleScale' || name === 'textScale') {
        if (typeof value !== 'number' || !(value >= MIN_SCALE && value <= MAX_SCALE)) {
          return fail('invalid_field', `Opcja „${name}" musi być liczbą od ${MIN_SCALE} do ${MAX_SCALE}.`)
        }
        Object.assign(options, { [name]: value })
      } else if (name === 'pkLogo') {
        if (typeof value !== 'string' || !PK_LOGOS.includes(value)) return fail('invalid_field', `Opcja „pkLogo" musi mieć jedną z wartości: ${list(PK_LOGOS)}.`)
        Object.assign(options, { pkLogo: value })
      } else if (name === 'ciekawostkaLayout') {
        if (typeof value !== 'string' || !CIEKAWOSTKA_LAYOUTS.includes(value)) {
          return fail('invalid_field', `Opcja „ciekawostkaLayout" musi mieć jedną z wartości: ${list(CIEKAWOSTKA_LAYOUTS)}.`)
        }
        Object.assign(options, { ciekawostkaLayout: value })
      } else if (name === 'qrUrl') {
        if (typeof value !== 'string' || value.length > MAX_TEXT) return fail('invalid_field', `Opcja „qrUrl" musi być tekstem do ${MAX_TEXT} znaków.`)
        options.qrUrl = clean(value)
      }
    }
  }

  const formatKey: ApiShape = shapeInput
  const form: FormValues = { ...EMPTY_FORM, ...text, ...options, visibility, photos, lists }
  // Pola tekstowe spoza `text` zostają puste z EMPTY_FORM.
  for (const name of FORM_TEXT_FIELDS) form[name] = text[name] ?? ''

  return {
    ok: true,
    state: {
      posterKey: key,
      colorScheme,
      lang,
      exportSettings: { ...DEFAULT_EXPORT_SETTINGS, format: formatKey },
      form,
    },
    formatKey,
    shape: shapeFor(formatKey, 'portrait', template.storyShape),
  }
}
