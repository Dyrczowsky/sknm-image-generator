import type { ComponentType } from 'react'

// --- Dane formularza (stan edytora) ---
export interface LogoSlotValue { enabled: boolean; src: string | null }
export interface PhotoValue { src: string; x: number; y: number }
export type ListItem = Record<string, string>

// Pola tekstowe formularza — te, które faktycznie ustawia onFieldChange.
export type FormTextField =
  | 'title' | 'subtitle' | 'speaker'
  | 'event_date' | 'event_time' | 'location'
  | 'badge' | 'badge2' | 'body'

// Widoczność pól tekstowych na plakacie. Brak klucza / `true` = widoczne;
// `false` = ukryte przez `opacity: 0` (element zostaje w layoucie, żeby nie
// rozsypać flexowej konstrukcji bloków plakatu).
export type FieldVisibility = Partial<Record<FormTextField, boolean>>

export interface FormValues {
  title: string
  subtitle: string
  speaker: string
  event_date: string
  event_time: string
  location: string
  badge: string
  badge2: string
  // Dłuższy akapit treści (np. szablon „Komunikat rozszerzony").
  body: string
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
  // domyślny rozmiar szablonu. Celowo NIE są zapisywane do draftu (sesyjne,
  // jak grafiki). `scaleLinked` - czy suwaki są spięte (przesunięcie
  // jednego ustawia oba na ten sam procent).
  titleScale: number
  textScale: number
  scaleLinked: boolean
}

// --- Wiersze SQLite (sql.js) ---
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

export interface HistoryRow {
  id: number
  title: string | null
  subtitle: string | null
  speaker: string | null
  event_date: string | null
  event_time: string | null
  location: string | null
  color_scheme: string | null
  created_at: string
  template_id: number | null
  template_name: string | null
  template_poster_key: string | null
}

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
// opcjonalne i null-tolerancyjne. HistoryRow wpasowuje się tu strukturalnie
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
  onFieldChange: (name: FormTextField, value: string) => void
  onVisibilityChange: (name: FormTextField, visible: boolean) => void
  onGraphicsAdd: (srcs: string[]) => void
  onGraphicRemove: (index: number) => void
  onGraphicMove: (index: number, dir: -1 | 1) => void
  onShowPkChange: (value: boolean) => void
  onQrUrlChange: (value: string) => void
  onTitleScaleChange: (value: number) => void
  onTextScaleChange: (value: number) => void
  onScaleLinkedChange: (value: boolean) => void
  onPhotoAdd: (fieldKey: string, src: string | null) => void
  onPhotoChangeAt: (fieldKey: string, index: number, src: string | null) => void
  onPhotoPositionChangeAt: (fieldKey: string, index: number, partial: { x?: number; y?: number }) => void
  onListItemAdd: (fieldKey: string) => void
  onListItemChange: (fieldKey: string, index: number, subKey: string, val: string) => void
  onListItemRemove: (fieldKey: string, index: number) => void
}

export interface RegistryEntry {
  name: string
  Component: ComponentType<PosterProps>
  // Szeroka wersja tego samego layoutu (zakładka „Baner").
  Banner: ComponentType<PosterProps>
  Form: ComponentType<FormProps>
}
