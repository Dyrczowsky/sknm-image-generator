import { describe, expect, it } from 'vitest'
import { buildCatalog } from '../api/catalog'
import { buildRenderState } from '../api/renderInput'
import { OFFSCREEN } from '../components/styles'
import { h, openingTag, render } from '../components/ui/testUtils'
import { RenderPage } from './RenderPage'

const NOTE = '<p>Strona techniczna generatora (API).</p>'

const job = (input: object) => {
  const r = buildRenderState(input)
  if (!r.ok) throw new Error(r.error.message)
  return { state: r.state, shape: r.shape }
}

describe('RenderPage', () => {
  it('bez zadania pokazuje tylko notkę techniczną', () => {
    expect(render(h(RenderPage, {}))).toBe(`<main>${NOTE}</main>`)
  })

  for (const template of buildCatalog().templates) {
    const shapes = template.storyShape ? (['square', 'story'] as const) : (['square'] as const)
    for (const shape of shapes) {
      it(`renderuje plakat „${template.key}" (${shape})`, () => {
        const hasTitle = template.fields.some((f) => f.name === 'title')
        const fields = hasTitle ? { title: 'Tytuł z API' } : {}
        const html = render(h(RenderPage, { initialJob: job({ template: template.key, shape, fields }) }))
        // Plakat poza ekranem (OFFSCREEN), nie ukryty - display:none psuje eksport.
        expect(openingTag(html, `<div class="${OFFSCREEN}"`)).toBe(`<div class="${OFFSCREEN}" aria-hidden="true">`)
        expect(html).toContain('width:1080px')
        if (hasTitle) expect(html).toContain('Tytuł z API')
      })
    }
  }
})
