import { createContext, useContext } from 'react'
import type { ComponentType } from 'react'
import type { IconName } from '../components/ui'
import type { ChangeMeta } from '../richText'
import type { SlideAspect, SlideBackground, SlideData, SlideThemeKey } from './types'

// Grupy w galerii „Nowy slajd".
export type SlideGroup = 'tytul' | 'tekst' | 'zdjecia' | 'wydarzenie'

export const SLIDE_GROUPS: readonly { group: SlideGroup; label: string }[] = [
  { group: 'tytul', label: 'Tytuł i sekcje' },
  { group: 'tekst', label: 'Tekst' },
  { group: 'zdjecia', label: 'Zdjęcia' },
  { group: 'wydarzenie', label: 'Wydarzenie i dane' },
]

// Pole panelu właściwości. Tekst widoczny na slajdzie edytuje się NA slajdzie
// (EditableText), więc panel ma tylko to, czego nie da się kliknąć i wpisać.
export type FieldSpec<T extends SlideData> =
  // Zdjęcie z kadrowaniem (`PhotoValue`).
  | { kind: 'photo'; key: KeysOf<T, 'photo'>; label: string }
  // Lista pozycji (karty, wpisy, tagi). `itemFields` - pola jednej pozycji
  // (edytowalne też w panelu); `newItem` - treść nowej pozycji.
  | {
      kind: 'list'
      key: KeysOf<T, 'list'>
      label: string
      itemLabel: string
      itemFields: readonly { key: string; label: string; multiline?: boolean }[]
      newItem: Record<string, string>
      min?: number
      max?: number
    }
  // Wybór wariantu (np. trzy kolumny / dwie numerowane).
  | { kind: 'select'; key: KeysOf<T, 'string'>; label: string; options: readonly { value: string; label: string }[] }
  // Przełącznik (np. „Pokaż drugie zdjęcie").
  | { kind: 'toggle'; key: KeysOf<T, 'boolean'>; label: string }
  // Tekst niewidoczny jako napis do kliknięcia (np. link w kodzie QR).
  | { kind: 'text'; key: KeysOf<T, 'string'>; label: string; placeholder?: string }

type Kinds = {
  photo: { src: string | null }
  list: Record<string, string>[]
  string: string
  boolean: boolean
}
type KeysOf<T, K extends keyof Kinds> = Extract<{ [P in keyof T]: T[P] extends Kinds[K] ? P : never }[keyof T], string>

export interface SlideDefinition<T extends SlideData = SlideData> {
  key: string
  label: string
  // Jedno zdanie w galerii układów.
  description: string
  group: SlideGroup
  icon: IconName
  defaults: T
  // Tło nowego slajdu tego układu (tytuł i zaproszenie są ciemne).
  background?: SlideBackground
  fields: readonly FieldSpec<T>[]
  // Ile kroków „pokazuj po kolei" ma slajd (0 = brak). Komponent owija
  // kolejne elementy w `<Step index={1..n}>`.
  steps?: (data: T) => number
  Component: ComponentType<{ data: T }>
}

// Typowany opis układu. `T` wynika z `defaults`, więc dopisanie układu nie
// wymaga zmian w types.ts. Rejestr trzyma wersje z wymazanym typem.
export function defineSlide<T extends SlideData>(definition: SlideDefinition<T>): SlideDefinition {
  return definition as unknown as SlideDefinition
}

// Wszystko, co komponent slajdu wie o miejscu, w którym jest rysowany.
export interface SlideRenderInfo {
  aspect: SlideAspect
  theme: SlideThemeKey
  background: SlideBackground
  mirrored: boolean
  // Numer slajdu (od 0) i liczba slajdów - do numeracji i pasa trójkątów.
  index: number
  total: number
  // Bieżący krok pokazu. `Infinity` = wszystko widoczne (edytor, miniatury, eksport).
  step: number
  // Czy slajd ma włączone „pokazuj po kolei".
  reveal: boolean
}

export const DEFAULT_RENDER_INFO: SlideRenderInfo = {
  aspect: '16:9',
  theme: 'granat',
  background: 'jasne',
  mirrored: false,
  index: 0,
  total: 1,
  step: Infinity,
  reveal: false,
}

export const SlideRenderContext = createContext<SlideRenderInfo>(DEFAULT_RENDER_INFO)

export function useSlideRender(): SlideRenderInfo {
  return useContext(SlideRenderContext)
}

export function useSlideAspect(): SlideAspect {
  return useContext(SlideRenderContext).aspect
}

// Edycja na slajdzie. Poza edytorem (miniatury, pokaz, eksport) `editable` jest
// false i EditableText rysuje zwykły tekst.
export interface SlideEdit {
  editable: boolean
  // `path` - ścieżka w `data`, np. `heading` albo `cards.2.title`.
  // `meta` - zmiana z formatowania: osobny krok cofania (nie skleja się z pisaniem).
  onText: (path: string, value: string, meta?: ChangeMeta) => void
  // AutoFit zgłasza, czy tekst się nie mieści nawet po zmniejszeniu.
  onOverflow: (id: string, overflowing: boolean) => void
}

export const READ_ONLY_EDIT: SlideEdit = {
  editable: false,
  onText: () => {},
  onOverflow: () => {},
}

export const SlideEditContext = createContext<SlideEdit>(READ_ONLY_EDIT)

export function useSlideEdit(): SlideEdit {
  return useContext(SlideEditContext)
}
