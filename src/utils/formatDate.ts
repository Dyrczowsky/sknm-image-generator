const MONTHS_GENITIVE = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]

const MONTHS_SHORT = [
  'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
  'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
]

interface ParsedDate { year: number; month: number; day: number }

function parseDate(isoDate: string): ParsedDate | null {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

// "12" - dzień miesiąca bez wiodącego zera
export function getDay(isoDate: string): string {
  const d = parseDate(isoDate)
  return d ? String(d.day) : ''
}

// "lis" / "LIS"
export function getMonthShort(isoDate: string, { upperCase = false }: { upperCase?: boolean } = {}): string {
  const d = parseDate(isoDate)
  if (!d) return ''
  const name = MONTHS_SHORT[d.month - 1]
  return upperCase ? name.toUpperCase() : name
}

// "18 kwietnia 2026"
export function formatFullDate(isoDate: string): string {
  const d = parseDate(isoDate)
  if (!d) return ''
  return `${d.day} ${MONTHS_GENITIVE[d.month - 1]} ${d.year}`
}
