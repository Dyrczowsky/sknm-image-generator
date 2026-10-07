import { describe, expect, it } from 'vitest'
import { PageFrame } from './PageFrame'
import { h, openingTag, render } from './ui/testUtils'

describe('PageFrame', () => {
  const html = render(h(PageFrame, { title: 'Projekty', description: 'Opis strony', actions: h('button', null, 'AKCJA') }, h('p', null, 'TREŚĆ')))

  it('region nazwany nagłówkiem h1', () => {
    const id = /<h1 id="([^"]+)"/.exec(html)?.[1]
    expect(id).toBeTruthy()
    expect(openingTag(html, '<section')).toContain(`aria-labelledby="${id}"`)
    expect(html).toMatch(/<h1[^>]*>Projekty<\/h1>/)
    expect(html.match(/<h1/g)).toHaveLength(1)
  })

  it('opis, akcje i treść są w tej kolejności', () => {
    const order = ['Opis strony', 'AKCJA', 'TREŚĆ'].map((part) => html.indexOf(part))
    expect(order.every((at) => at >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('bez opisu i akcji zostaje sam tytuł z treścią', () => {
    const bare = render(h(PageFrame, { title: 'Notatki' }, 'TREŚĆ'))
    expect(bare).toContain('TREŚĆ')
    expect(bare).not.toContain('<p')
  })
})
