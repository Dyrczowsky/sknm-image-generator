import type { CSSProperties } from 'react'
import type { FormTextField, RawPosterData } from '../types'

function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function nowTime(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Przykładowe wartości - używane zarówno jako placeholdery w formularzu,
// jak i jako dane wypełniające podgląd plakatu, dopóki pola są puste.
export const PLACEHOLDERS = {
  title: 'To jest tytuł przykładowego referatu',
  speaker: 'dr Marcin Skrzyński',
  location: 'sala 304/12',
  get event_date() {
    return todayIso()
  },
  get event_time() {
    return nowTime()
  },
}

export function withPlaceholders(data: RawPosterData) {
  const visibility = data.visibility ?? {}
  return {
    title: data.title || PLACEHOLDERS.title,
    subtitle: data.subtitle,
    speaker: data.speaker || PLACEHOLDERS.speaker,
    event_date: data.event_date || PLACEHOLDERS.event_date,
    event_time: data.event_time || PLACEHOLDERS.event_time,
    location: data.location || PLACEHOLDERS.location,
    badge: data.badge,
    badge2: data.badge2,
    graphics: data.graphics ?? [],
    showPkLogo: data.showPkLogo ?? true,
    qrUrl: data.qrUrl ?? '',
    colors: data.colors ?? {},
    photos: data.photos ?? {},
    lists: data.lists ?? {},
    // `true` gdy użytkownik wyłączył widoczność danego pola.
    hidden: (name: FormTextField): boolean => visibility[name] === false,
    // Styl do rozlania na element pola: ukryte pole dostaje `display: none`
    // (znika z układu, plakat sam się przekłada - flexowa konstrukcja bloków
    // domyka lukę zamiast zostawiać puste miejsce po `opacity: 0`).
    fx: (name: FormTextField): CSSProperties | undefined =>
      visibility[name] === false ? { display: 'none' } : undefined,
  }
}
