import { ACCENT_NAMES, accentAllowed, schemesFor } from '../posters/schemes'
import type { AccentName } from '../types'

// Wybrana kolorystyka plakatu: schemat + opcjonalny akcent (`undefined` =
// domyślny akcent schematu).
export interface ColorChoice {
  scheme: string | undefined
  accent: AccentName | undefined
}

// `color_scheme` w bazie koduje schemat i opcjonalny akcent jako
// `"<schemat>~<akcent>"` (albo sam `"<schemat>"`). Mieści się w istniejącej
// kolumnie TEXT — bez zmiany kształtu tabel.

export function encodeScheme(scheme: string | undefined, accent?: AccentName): string | undefined {
  if (!scheme) return undefined
  return accent ? `${scheme}~${accent}` : scheme
}

export function decodeScheme(raw: string | null | undefined): ColorChoice {
  if (!raw) return { scheme: undefined, accent: undefined }
  const [scheme, rawAccent] = raw.split('~')
  const accent = ACCENT_NAMES.includes(rawAccent as AccentName) ? (rawAccent as AccentName) : undefined
  return { scheme: scheme || undefined, accent }
}

// Dopasowuje kolorystykę do layoutu: brak schematu → domyślny (pierwszy)
// schemat layoutu, a akcent, którego ten schemat nie dopuszcza, jest
// odpinany. Nieznany layout nie ma schematów, więc zostaje `undefined`.
export function fitColorsToLayout(posterKey: string | undefined, choice: Partial<ColorChoice> = {}): ColorChoice {
  const layoutKey = posterKey ?? ''
  const scheme = choice.scheme ?? schemesFor(layoutKey)[0]
  const accent = accentAllowed(layoutKey, scheme, choice.accent) ? choice.accent : undefined
  return { scheme, accent }
}
