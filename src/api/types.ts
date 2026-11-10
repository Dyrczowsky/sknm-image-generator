import type { AccentName, FormTextField } from '../types'

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
