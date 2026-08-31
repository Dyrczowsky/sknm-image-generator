import { describe, expect, it } from 'vitest'
import {
  buildBugIssueUrl,
  buildPosterRequestMailto,
  formatBugContext,
  TICKET_EMAIL,
  TICKET_REPO,
  type BugContextInput,
} from './issueUrl'
import type { FormValues } from '../types'

const emptyForm: FormValues = {
  title: '', subtitle: '', speaker: '', event_date: '', event_time: '',
  location: '', badge: '', badge2: '', visibility: {}, graphics: [],
  showPkLogo: false, qrUrl: '', colors: {}, photos: {}, lists: {},
}

const ctx = (over: Partial<BugContextInput> = {}): BugContextInput => ({
  templateName: 'Wykład', posterKey: 'wyklad',
  schemeKey: 'okazjonalnyZloty', schemeLabel: 'Okazjonalny złoty',
  form: emptyForm, appUrl: 'https://example.test/app',
  userAgent: 'TestUA/1.0', version: 'a1b2c3d', ...over,
})

describe('formatBugContext', () => {
  it('zawiera szablon + poster_key oraz schemat + etykietę', () => {
    const s = formatBugContext(ctx())
    expect(s).toContain('Wykład (`wyklad`)')
    expect(s).toContain('Okazjonalny złoty (`okazjonalnyZloty`)')
  })

  it('z data-URL-i w graphics/photos bierze tylko liczby — zero base64', () => {
    const form: FormValues = {
      ...emptyForm,
      graphics: ['data:image/png;base64,AAAA', 'data:image/png;base64,BBBB'],
      photos: { photo: [{ src: 'data:image/jpeg;base64,CCCC', x: 0, y: 0 }] },
    }
    const s = formatBugContext(ctx({ form }))
    expect(s).toContain('grafiki ×2')
    expect(s).toContain('zdjęcia ×1')
    expect(s).not.toContain('data:')
    expect(s).not.toContain('base64')
  })

  it('puste schemeKey / qrUrl → „—"', () => {
    const s = formatBugContext(ctx({ schemeKey: undefined, schemeLabel: undefined }))
    expect(s).toMatch(/\*\*Schemat:\*\* —/)
    expect(s).toMatch(/\*\*QR:\*\* —/)
  })

  it('ukryte pola wypisane, widoczne pominięte', () => {
    const form: FormValues = { ...emptyForm, visibility: { speaker: false, location: false, title: true } }
    const s = formatBugContext(ctx({ form }))
    expect(s).toMatch(/\*\*Ukryte pola:\*\*[^\n]*speaker/)
    expect(s).toMatch(/\*\*Ukryte pola:\*\*[^\n]*location/)
    expect(s).not.toMatch(/\*\*Ukryte pola:\*\*[^\n]*title/)
  })
})

describe('buildBugIssueUrl', () => {
  it('poprawny host, ścieżka i parametry', () => {
    const url = buildBugIssueUrl({ userText: 'Coś nie działa', context: ctx() })
    const u = new URL(url)
    expect(u.origin + u.pathname).toBe(`https://github.com/${TICKET_REPO}/issues/new`)
    expect(u.searchParams.get('labels')).toBe('bug')
    expect(u.searchParams.get('title')).toBe('Błąd: Coś nie działa')
    expect(u.searchParams.get('body')).toContain('Coś nie działa')
    expect(u.searchParams.get('body')).toContain('## Kontekst')
  })

  it('tytuł „Błąd: " + I linia, całość ≤ 80 zn.', () => {
    const url = buildBugIssueUrl({ userText: `\n\n${'x'.repeat(200)}\ndruga`, context: ctx() })
    const title = new URL(url).searchParams.get('title') as string
    expect(title.startsWith('Błąd: ')).toBe(true)
    expect(title.length).toBeLessThanOrEqual(80)
  })

  it('brak niepustej linii → „Zgłoszenie błędu"', () => {
    const url = buildBugIssueUrl({ userText: '   \n  \n', context: ctx() })
    expect(new URL(url).searchParams.get('title')).toBe('Zgłoszenie błędu')
  })

  it('znaki specjalne i polskie przechodzą round-trip', () => {
    const text = 'Tło #fff & <coś> — źdźbło ączęńó'
    const url = buildBugIssueUrl({ userText: text, context: ctx() })
    expect(new URL(url).searchParams.get('body')).toContain(text)
  })

  it('kontakt dołączany tylko gdy podany', () => {
    const withC = buildBugIssueUrl({ userText: 'x', contact: 'jan@ex.pl', context: ctx() })
    expect(new URL(withC).searchParams.get('body')).toContain('**Kontakt:** jan@ex.pl')
    const without = buildBugIssueUrl({ userText: 'x', context: ctx() })
    expect(new URL(without).searchParams.get('body')).not.toContain('Kontakt:')
  })

  it('gigantyczny opis → URL ≤ 7500 i marker obcięcia', () => {
    const url = buildBugIssueUrl({ userText: 'A'.repeat(20000), context: ctx() })
    expect(url.length).toBeLessThanOrEqual(7500)
    expect(new URL(url).searchParams.get('body')).toContain('kontekst skrócony')
  })
})

describe('buildPosterRequestMailto', () => {
  it('mailto z tematem i wymaganymi polami', () => {
    const url = buildPosterRequestMailto({ event: 'Dzień Liczby Pi', details: 'Plakat A2', contact: 'Jan, jan@ex.pl' })
    expect(url.startsWith(`mailto:${TICKET_EMAIL}?`)).toBe(true)
    const q = new URLSearchParams(url.slice(url.indexOf('?') + 1))
    expect(q.get('subject')).toBe('Zapotrzebowanie na plakat: Dzień Liczby Pi')
    expect(q.get('body')).toContain('Dzień Liczby Pi')
    expect(q.get('body')).toContain('Jan, jan@ex.pl')
  })

  it('puste opcjonalne pola pominięte w treści', () => {
    const url = buildPosterRequestMailto({ event: 'X', details: 'Y', contact: 'Z' })
    const body = new URLSearchParams(url.slice(url.indexOf('?') + 1)).get('body') as string
    expect(body).not.toContain('Data wydarzenia:')
    expect(body).not.toContain('Plakat potrzebny do:')
  })

  it('bardzo długie details → URL ≤ 1800 i marker obcięcia', () => {
    const url = buildPosterRequestMailto({ event: 'X', details: 'D'.repeat(5000), contact: 'Z' })
    expect(url.length).toBeLessThanOrEqual(1800)
    const body = new URLSearchParams(url.slice(url.indexOf('?') + 1)).get('body') as string
    expect(body).toContain('treść skrócona')
  })

  it('bardzo długa nazwa wydarzenia → URL ≤ 1800', () => {
    const url = buildPosterRequestMailto({ event: 'W'.repeat(5000), details: 'x', contact: 'z' })
    expect(url.length).toBeLessThanOrEqual(1800)
  })

  it('opis z emoji przy granicy obcięcia → nie rzuca', () => {
    expect(() => buildBugIssueUrl({ userText: '🎉'.repeat(6000), context: ctx() })).not.toThrow()
  })

  it('nazwa wydarzenia z emoji dłuższa niż limit tematu → nie rzuca i URL ≤ 1800', () => {
    const url = buildPosterRequestMailto({ event: '🎉'.repeat(5000), details: 'x', contact: 'z' })
    expect(url.length).toBeLessThanOrEqual(1800)
  })
})
