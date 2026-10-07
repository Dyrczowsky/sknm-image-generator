import type { ComponentType } from 'react'

// --- Dane formularza (stan edytora) ---
export interface PhotoValue { src: string; x: number; y: number }
export type ListItem = Record<string, string>

// Pola tekstowe formularza - zapisywane w draftcie i sterowane checkboxem
// widoczności.
export const FORM_TEXT_FIELDS = [
  'title', 'subtitle', 'speaker', 'event_date', 'event_time', 'location', 'badge', 'badge2', 'body',
] as const
export type FormTextField = (typeof FORM_TEXT_FIELDS)[number]

// Widoczność pól tekstowych na plakacie. Brak klucza / `true` = widoczne;
// `false` = ukryte przez `display: none` (pole znika z układu, patrz
// `withPlaceholders` w posters/fallback.ts).
export type FieldVisibility = Partial<Record<FormTextField, boolean>>

export interface FormValues extends Record<FormTextField, string> {
  // `body` to dłuższy akapit treści (np. szablon „Komunikat rozszerzony").
  visibility: FieldVisibility
  // Grafiki/logotypy w stopce (data URL-e), w kolejności wyświetlania.
  graphics: string[]
  // Czy przed listą grafik renderować domyślne logo Politechniki Krakowskiej.
  showPkLogo: boolean
  // Link/tekst do zakodowania w kodzie QR w stopce. Pusty = brak QR.
  qrUrl: string
  photos: Record<string, PhotoValue[]>
  lists: Record<string, ListItem[]>
  // Mnożnik rozmiaru tytułu/pozostałego tekstu (suwaki w formularzu) - 1 =
  // domyślny rozmiar szablonu. `scaleLinked` - czy suwaki są spięte
  // (przesunięcie jednego ustawia oba na ten sam procent).
  titleScale: number
  textScale: number
  scaleLinked: boolean
}

// Przekształcenie stanu formularza. Formularze zgłaszają zmiany jako takie
// funkcje (gotowe są w editor/formState.ts), a edytor podaje je do `setForm`.
export type FormUpdate = (form: FormValues) => FormValues

// --- Wiersze lokalnej bazy SQLite (sql.js): szablony i draft ---
export interface TemplateRow { id: number; name: string; poster_key: string }

export interface DraftRow {
  id: number
  title: string | null
  subtitle: string | null
  speaker: string | null
  event_date: string | null
  event_time: string | null
  location: string | null
  badge: string | null
  badge2: string | null
  body: string | null
  visibility: string | null
  color_scheme: string | null
  template_id: number | null
  updated_at: string | null
}

// --- Wspólna historia (Supabase, tabela `sknm_poster_history`) ---
export interface HistoryEntry {
  id: number
  // Znacznik czasu ISO.
  created_at: string
  // Klucz layoutu z rejestru plakatów - wspólny dla wszystkich urządzeń
  // (lokalne `templates.id` różnią się między przeglądarkami).
  poster_key: string
  title: string
  subtitle: string
  speaker: string
  event_date: string
  event_time: string
  location: string
  color_scheme: string | null
}

export type NewHistoryEntry = Omit<HistoryEntry, 'id' | 'created_at'>

// --- Schematy kolorów ---
export type SygnetName = 'negatywny' | 'granat' | 'zloty' | 'szary' | 'czarny' | 'srebrny'
export type LogoVariant = 'light' | 'dark'
export type AccentName = 'zolty' | 'pomaranczowy' | 'granatowy' | 'zloty' | 'srebrny'
export type PosterLang = 'pl' | 'en'

export interface ResolvedScheme {
  cssVars: Record<`--${string}`, string>
  sygnet: SygnetName | undefined
  logoVariant: LogoVariant | undefined
}

// --- Propsy plakatów / formularzy / rejestru ---
// `data` plakatu: fragment formularza (edytor / miniatury = {}), pola
// opcjonalne i null-tolerancyjne. HistoryEntry wpasowuje się tu strukturalnie
// (pola tekstowe pokrywają się, nadmiarowe kolumny nie przeszkadzają).
export type RawPosterData = { [K in keyof FormValues]?: FormValues[K] | null }
// Kształt renderowanego plakatu. `square` to format social i wszystkie
// miniatury; `portrait`/`landscape` to proporcja papieru A (1:√2);
// `cover`/`event` to banery Facebooka (okładka strony / wydarzenia).
export type PosterShape = 'square' | 'portrait' | 'landscape' | 'cover' | 'event'
// Zakładka wyboru szablonu: grafika social (i druk) albo szeroki baner.
export type Medium = 'social' | 'banner'
export type Orientation = 'portrait' | 'landscape'
export type FileType = 'png' | 'pdf'

export interface PosterProps { data: RawPosterData; scheme?: string; accent?: AccentName; lang?: PosterLang }

export interface FormProps {
  value: FormValues
  onChange: (update: FormUpdate) => void
}

export interface RegistryEntry {
  name: string
  Component: ComponentType<PosterProps>
  // Szeroka wersja tego samego layoutu (zakładka „Baner").
  Banner: ComponentType<PosterProps>
  // Baner tego layoutu ma miejsce na zdjęcie - formularz banera pokaże galerię.
  bannerPhoto?: boolean
  Form: ComponentType<FormProps>
}
