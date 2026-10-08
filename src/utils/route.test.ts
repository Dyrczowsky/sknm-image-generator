import { describe, expect, it } from 'vitest'
import { PAGES, parseRoute, routeHref } from './route'

describe('PAGES', () => {
  it('ma pięć stron z oczekiwanymi hashami i etykietami', () => {
    expect(PAGES.map(p => [p.page, p.hash, p.label])).toEqual([
      ['editor', '#/', 'Edytor'],
      ['projects', '#/projekty', 'Projekty'],
      ['assets', '#/grafiki', 'Grafiki'],
      ['history', '#/historia', 'Historia'],
      ['notes', '#/notatki', 'Notatki'],
    ])
  })
})

describe('parseRoute', () => {
  it('pusty hash, # i #/ → edytor', () => {
    for (const hash of ['', '#', '#/', '/']) expect(parseRoute(hash), hash).toBe('editor')
  })
  it('znane hashe → odpowiednie strony', () => {
    for (const { page, hash } of PAGES) expect(parseRoute(hash), hash).toBe(page)
  })
  it('końcowe ukośniki i wielkość liter są ignorowane', () => {
    expect(parseRoute('#/projekty/')).toBe('projects')
    expect(parseRoute('#/projekty//')).toBe('projects')
    expect(parseRoute('#/GRAFIKI')).toBe('assets')
    expect(parseRoute('#/Historia/')).toBe('history')
  })
  it('sufiks zapytania jest ignorowany', () => {
    expect(parseRoute('#/notatki?x=1')).toBe('notes')
    expect(parseRoute('#/projekty/?id=abc&a=b')).toBe('projects')
  })
  it('nieznane wartości → edytor', () => {
    for (const hash of ['#/nie-ma', '#/projekty/inne', '#foo', '#/?x', 'projekty-x']) expect(parseRoute(hash), hash).toBe('editor')
  })
  it('hash z tokenami Supabase → edytor i bez wyjątku', () => {
    const hashes = [
      '#access_token=abc.def.ghi&expires_in=3600&refresh_token=x&token_type=bearer&type=recovery',
      '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid',
      '#access_token=%E0%A4%A&type=signup',
      '#access_token=a/projekty&type=recovery',
    ]
    for (const hash of hashes) expect(() => parseRoute(hash), hash).not.toThrow()
    for (const hash of hashes) expect(parseRoute(hash), hash).toBe('editor')
  })
})

describe('routeHref', () => {
  it('zwraca hash strony i jest odwrotnością parseRoute', () => {
    expect(routeHref('projects')).toBe('#/projekty')
    expect(routeHref('editor')).toBe('#/')
    for (const { page } of PAGES) expect(parseRoute(routeHref(page))).toBe(page)
  })
})
