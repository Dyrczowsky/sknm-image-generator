import { ACCENT_NAMES } from '../posters/schemes'
import type { AccentName } from '../types'

// `color_scheme` w bazie koduje schemat i opcjonalny akcent jako
// `"<schemat>~<akcent>"` (albo sam `"<schemat>"`). Mieści się w istniejącej
// kolumnie TEXT — bez zmiany kształtu tabel.

export function encodeScheme(scheme: string | undefined, accent?: AccentName): string | undefined {
  if (!scheme) return undefined
  return accent ? `${scheme}~${accent}` : scheme
}

export function decodeScheme(raw: string | null | undefined): {
  scheme: string | undefined
  accent: AccentName | undefined
} {
  if (!raw) return { scheme: undefined, accent: undefined }
  const [scheme, rawAccent] = raw.split('~')
  const accent = ACCENT_NAMES.includes(rawAccent as AccentName) ? (rawAccent as AccentName) : undefined
  return { scheme: scheme || undefined, accent }
}
