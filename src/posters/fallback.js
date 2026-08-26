function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function nowTime() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
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

export function withPlaceholders(data) {
  return {
    title: data.title || PLACEHOLDERS.title,
    subtitle: data.subtitle,
    speaker: data.speaker || PLACEHOLDERS.speaker,
    event_date: data.event_date || PLACEHOLDERS.event_date,
    event_time: data.event_time || PLACEHOLDERS.event_time,
    location: data.location || PLACEHOLDERS.location,
    badge: data.badge,
    logos: data.logos || {},
    photos: data.photos || {},
    lists: data.lists || {},
  }
}
