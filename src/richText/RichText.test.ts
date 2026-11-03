import { describe, expect, it } from 'vitest'
import { h, render } from '../components/ui/testUtils'
import { MARK } from './format'
import { RichText } from './RichText'

const RICH = ''
const CENTER = ''
const style = (marks: number) => String.fromCharCode(0xe100 + marks)

describe('RichText', () => {
  it('zwykły string to sam tekst z escapowaniem', () => {
    expect(render(h(RichText, { value: 'a<b>&\nc' }))).toBe('a&lt;b&gt;&amp;\nc')
  })

  it('pusta wartość nie rysuje nic', () => {
    expect(render(h(RichText, { value: '' }))).toBe('')
  })

  it('pogrubiony run z akcentem dostaje span ze stylem', () => {
    const html = render(h(RichText, { value: `${RICH}${style(MARK.bold | MARK.accent)}x` }))
    expect(html).toContain('<span style="font-weight:bolder;color:var(--rich-accent, var(--accent))">x</span>')
  })

  it('podkreślenie i przekreślenie idą razem w textDecorationLine', () => {
    const html = render(h(RichText, { value: `${RICH}${style(MARK.underline | MARK.strike)}x` }))
    expect(html).toContain('text-decoration-line:underline line-through')
  })

  it('wiersz wyśrodkowany to div z textAlign, w trybie inline bez divów', () => {
    const value = `${RICH}${CENTER}ab\ncd`
    const html = render(h(RichText, { value }))
    expect(html).toContain('<div style="text-align:center">ab</div>')
    expect(html).toContain('<div>cd</div>')
    expect(render(h(RichText, { value, inline: true }))).not.toContain('<div')
  })

  it('pusty wiersz przy wyrównaniu to div z br', () => {
    expect(render(h(RichText, { value: `${RICH}${CENTER}ab\n` }))).toContain('<div><br/></div>')
  })
})
