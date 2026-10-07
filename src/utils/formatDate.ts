import type { PosterLang } from '../types'

// Miesiąc w pełnej dacie: po polsku w dopełniaczu („18 kwietnia").
const MONTHS_FULL: Record<PosterLang, string[]> = {
  pl: [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
}

const MONTHS_SHORT: Record<PosterLang, string[]> = {
  pl: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

interface ParsedDate { year: number; month: number; day: number }

function parseDate(isoDate: string): ParsedDate | null {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

// "12" - dzień miesiąca bez wiodącego zera (ten sam format w obu językach)
export function getDay(isoDate: string): string {
  const d = parseDate(isoDate)
  return d ? String(d.day) : ''
}

// "lis" / "LIS" (pl) albo "Nov" / "NOV" (en)
export function getMonthShort(isoDate: string, { upperCase = false, lang = 'pl' }: { upperCase?: boolean; lang?: PosterLang } = {}): string {
  const d = parseDate(isoDate)
  if (!d) return ''
  const name = MONTHS_SHORT[lang][d.month - 1]
  return upperCase ? name.toUpperCase() : name
}

// "18 kwietnia 2026" (pl, dopełniacz) albo "18 April 2026" (en, dzień pierwszy
// jak w pl, żeby układy dopasowane do polskiej daty nie rozjeżdżały się)
export function formatFullDate(isoDate: string, lang: PosterLang = 'pl'): string {
  const d = parseDate(isoDate)
  if (!d) return ''
  return `${d.day} ${MONTHS_FULL[lang][d.month - 1]} ${d.year}`
}

// "2026-10-07 11:30" - znacznik czasu ISO (np. z bazy) w czasie lokalnym.
// Nieprawidłowy znacznik → pusty string.
export function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
