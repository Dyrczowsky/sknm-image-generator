import type { AccentName, CiekawostkaLayout, FormTextField, NewHistoryEntry, PkLogoKind, PosterLang } from '../types'

// Maszynowo czytelny opis szablonów dla zewnętrznej AI (API / MCP).
// Tylko `import type` - ten plik trafia też do Cloudflare Workera.
export interface CatalogField {
  name: FormTextField
  label: string
  type: 'text' | 'date' | 'time' | 'textarea'
  placeholder?: string
}

export interface CatalogTemplate {
  key: string
  name: string
  useFor: string
  fields: CatalogField[]
  // Zdjęcia idą pod `photos.photo`.
  photo: { label: string } | null
  lists: { agenda: { itemFields: ['time', 'title', 'subtitle'] } } | null
  // Pierwszy schemat = domyślny.
  schemes: { name: string; label: string; accents: AccentName[] }[]
  storyShape: boolean
  // Klucze opcji, które mają znaczenie dla tego układu.
  options: string[]
}

export interface Catalog {
  version: 1
  templates: CatalogTemplate[]
}

// --- Wejście i błędy API renderu ---

export type ApiShape = 'square' | 'story'

// `src` to data URL (Worker już pobrał i zdekodował obraz).
export interface RenderPhoto { src: string; x?: number; y?: number; zoom?: number }

export interface RenderInput {
  template: string
  shape?: ApiShape
  scheme?: string
  lang?: PosterLang
  fields?: Partial<Record<FormTextField, string>>
  photos?: { photo?: RenderPhoto[] }
  lists?: { agenda?: { time?: string; title?: string; subtitle?: string }[] }
  options?: {
    qrUrl?: string
    showPkLogo?: boolean
    pkLogo?: PkLogoKind
    showSknmLogo?: boolean
    wideSubtitle?: boolean
    ciekawostkaLayout?: CiekawostkaLayout
    fillAgenda?: boolean
    titleScale?: number
    textScale?: number
  }
}

export type ApiErrorCode =
  | 'unauthorized' | 'rate_limited' | 'bad_request' | 'unknown_template' | 'invalid_scheme'
  | 'invalid_field' | 'photo_not_image' | 'photo_too_large' | 'photo_fetch_failed' | 'too_many_photos'
  | 'too_large' | 'render_unavailable' | 'render_failed' | 'storage_failed'

export interface ApiError { code: ApiErrorCode; message: string }

// --- Wynik renderu ---

export interface RenderOk {
  ok: true
  png: string // base64, bez prefiksu data:
  width: number
  height: number
  photoRefs: string[]
  historyRow: NewHistoryEntry
  preview?: string // JPEG base64 w połowie rozmiaru, dokłada go Worker (podgląd w czacie)
}

export type RenderResult = RenderOk | { ok: false; error: ApiError }
