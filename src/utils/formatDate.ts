import type { PosterLang } from '../types'

const MONTHS_GENITIVE = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]

const MONTHS_SHORT = [
  'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
  'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
]

const MONTHS_FULL_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
  const name = lang === 'en' ? MONTHS_SHORT_EN[d.month - 1] : MONTHS_SHORT[d.month - 1]
  return upperCase ? name.toUpperCase() : name
}

// "18 kwietnia 2026" (pl, dopełniacz) albo "18 April 2026" (en, dzień pierwszy
// jak w pl, żeby układy dopasowane do polskiej daty nie rozjeżdżały się)
export function formatFullDate(isoDate: string, lang: PosterLang = 'pl'): string {
  const d = parseDate(isoDate)
  if (!d) return ''
  const month = lang === 'en' ? MONTHS_FULL_EN[d.month - 1] : MONTHS_GENITIVE[d.month - 1]
  return `${d.day} ${month} ${d.year}`
}
