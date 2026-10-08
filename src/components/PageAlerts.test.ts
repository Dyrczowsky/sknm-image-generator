import { describe, expect, it } from 'vitest'
import type { SaveStatus } from '../workspace/syncState'
import { saveProblem } from '../workspace/syncState'
import { PageAlerts } from './PageAlerts'
import { h, render } from './ui/testUtils'

const noop = () => {}
const alerts = (patch: { notice?: string | null; exportNote?: string | null; saveStatus?: SaveStatus } = {}) =>
  render(h(PageAlerts, { notice: null, exportNote: null, saveStatus: 'saved', onDismissNotice: noop, onDismissExportNote: noop, ...patch }))

describe('PageAlerts', () => {
  it('bez problemów nic nie renderuje', () => {
    for (const saveStatus of ['local', 'saved', 'dirty', 'saving', 'paused'] as const) expect(alerts({ saveStatus }), saveStatus).toBe('')
  })

  it('komunikat kopii roboczej ma role=alert i „Zamknij"', () => {
    const html = alerts({ notice: 'Nie otwarto projektu.' })
    expect(html).toContain('role="alert"')
    expect(html).toContain('Nie otwarto projektu.')
    expect(html).toContain('>Zamknij<')
  })

  it('wynik eksportu (błąd, dpi, historia) jest widoczny poza edytorem', () => {
    for (const note of ['Nie udało się wygenerować pliku. Spróbuj mniejszego formatu.', 'Plik zapisany, ale nie udało się dopisać wpisu do historii.']) {
      const html = alerts({ exportNote: note })
      expect(html).toContain('role="alert"')
      expect(html).toContain(note)
    }
  })

  it('błąd zapisu i konflikt: krótki opis i odnośnik do edytora', () => {
    for (const saveStatus of ['error', 'conflict'] as const) {
      const html = alerts({ saveStatus })
      expect(html).toContain('role="alert"')
      expect(html).toContain(saveProblem(saveStatus) as string)
      expect(html).toMatch(/<a href="#\/"[^>]*>Przejdź do edytora<\/a>/)
    }
  })

  it('wszystkie trzy komunikaty naraz', () => {
    const html = alerts({ notice: 'N', exportNote: 'E', saveStatus: 'error' })
    expect(html.match(/role="alert"/g)).toHaveLength(3)
  })
})
