import type { ComponentType } from 'react'

// --- Dane formularza (stan edytora) ---
export interface LogoSlotValue { enabled: boolean; src: string | null }
export interface PhotoValue { src: string; x: number; y: number }
export type ListItem = Record<string, string>

// Pola tekstowe formularza — te, które faktycznie ustawia onFieldChange.
export type FormTextField =
  | 'title' | 'subtitle' | 'speaker'
  | 'event_date' | 'event_time' | 'location'
  | 'badge' | 'badge2'

// Widoczność pól tekstowych na plakacie. Brak klucza / `true` = widoczne;
// `false` = ukryte przez `opacity: 0` (element zostaje w layoucie, żeby nie
// rozsypać flexowej konstrukcji bloków plakatu).
export type FieldVisibility = Partial<Record<FormTextField, boolean>>

// Nadpisania kolorów per szablon (pusty string = wartość ze schematu).
// Gość: `goscBoxBg`/`goscBoxText` = prostokąt z datą, `goscTextColor` =
// etykieta + „Wstęp wolny" (odpięte od `--accent`).
export type FormColorField = 'goscBoxBg' | 'goscBoxText' | 'goscTextColor'

export interface FormValues {
  title: string
  subtitle: string
  speaker: string
  event_date: string
  event_time: string
  location: string
  badge: string
  badge2: string
  visibility: FieldVisibility
  // Grafiki/logotypy w stopce (data URL-e), w kolejności wyświetlania.
  graphics: string[]
  // Czy przed listą grafik renderować domyślne logo Politechniki Krakowskiej.
  showPkLogo: boolean
  // Link/tekst do zakodowania w kodzie QR w stopce. Pusty = brak QR.
  qrUrl: string
  // Kolor modułów kodu QR. Pusty = dopasowany do schematu kolorów plakatu.
  qrColor: string
  // Nadpisania kolorów per szablon (pusty = wartość ze schematu).
  colors: Partial<Record<FormColorField, string>>
  photos: Record<string, PhotoValue[]>
  lists: Record<string, ListItem[]>
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
export type SygnetName = 'negatywny' | 'granat' | 'zloty' | 'szary' | 'czarny'
export type LogoVariant = 'light' | 'dark'

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
export interface PosterProps { data: RawPosterData; scheme?: string }

export interface FormProps {
  value: FormValues
  onFieldChange: (name: FormTextField, value: string) => void
  onVisibilityChange: (name: FormTextField, visible: boolean) => void
  onGraphicsAdd: (srcs: string[]) => void
  onGraphicRemove: (index: number) => void
  onGraphicMove: (index: number, dir: -1 | 1) => void
  onShowPkChange: (value: boolean) => void
  onQrUrlChange: (value: string) => void
  onQrColorChange: (value: string) => void
  // Nadpisanie koloru per szablon; pusty string = wyczyszczenie (wartość ze schematu).
  onColorChange: (name: FormColorField, value: string) => void
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
  Form: ComponentType<FormProps>
}
