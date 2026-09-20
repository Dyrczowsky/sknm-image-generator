import { describe, expect, it } from 'vitest'
import { getDay, getMonthShort, formatFullDate } from './formatDate'

describe('getDay', () => {
  it('nie zależy od języka', () => {
    expect(getDay('2026-09-20')).toBe('20')
  })
  it('pusta/nieprawidłowa data → pusty string', () => {
    expect(getDay('')).toBe('')
  })
})

describe('getMonthShort', () => {
  it('domyślnie (bez lang) zwraca polski skrót, jak dotychczas', () => {
    expect(getMonthShort('2026-09-20')).toBe('wrz')
    expect(getMonthShort('2026-09-20', { upperCase: true })).toBe('WRZ')
  })
  it('lang: "pl" jawnie — to samo, co domyślnie', () => {
    expect(getMonthShort('2026-09-20', { lang: 'pl' })).toBe('wrz')
  })
  it('lang: "en" zwraca angielski skrót', () => {
    expect(getMonthShort('2026-09-20', { lang: 'en' })).toBe('Sep')
    expect(getMonthShort('2026-09-20', { upperCase: true, lang: 'en' })).toBe('SEP')
  })
  it('pusta data → pusty string niezależnie od lang', () => {
    expect(getMonthShort('', { lang: 'en' })).toBe('')
  })
})

describe('formatFullDate', () => {
  it('domyślnie (bez lang) zwraca polską datę — dzień + dopełniacz miesiąca + rok', () => {
    expect(formatFullDate('2026-09-20')).toBe('20 września 2026')
  })
  it('lang: "en" zwraca angielską datę — dzień + pełna nazwa miesiąca + rok', () => {
    expect(formatFullDate('2026-09-20', 'en')).toBe('20 September 2026')
  })
  it('pusta data → pusty string', () => {
    expect(formatFullDate('', 'en')).toBe('')
  })
})
