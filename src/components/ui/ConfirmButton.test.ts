import { describe, expect, it } from 'vitest'
import { ConfirmButton } from './ConfirmButton'
import { h, openingTag, render } from './testUtils'

const renderConfirm = (over: object = {}) =>
  render(h(ConfirmButton, { question: 'Usunąć wpis dla całego zespołu?', onConfirm: () => {}, ...over }, 'Usuń'))

describe('ConfirmButton', () => {
  it('w spoczynku to jeden zwykły przycisk - pytanie i potwierdzenie pojawiają się dopiero po kliknięciu', () => {
    const html = renderConfirm()
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toMatch(/^<button type="button"[^>]*>Usuń<\/button>$/)
    expect(html).not.toContain('Usunąć wpis')
    expect(html).not.toContain('Tak, usuń')
  })

  it('domyślnie wygląda jak akcja niszcząca (czerwony tekst + podpis), nie jak główna', () => {
    const tag = openingTag(renderConfirm(), '<button')
    expect(tag).toContain('text-danger')
    expect(tag).not.toContain('bg-danger-solid')
  })

  it('ikona, disabled i busy przechodzą na przycisk', () => {
    expect(renderConfirm({ icon: 'trash' })).toContain('<svg')
    expect(openingTag(renderConfirm({ disabled: true }), '<button')).toContain('disabled=""')
    expect(openingTag(renderConfirm({ busy: true }), '<button')).toContain('aria-busy="true"')
  })
})
