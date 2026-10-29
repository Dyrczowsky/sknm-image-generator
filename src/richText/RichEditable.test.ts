import { describe, expect, it } from 'vitest'
import { h, openingTag, render } from '../components/ui/testUtils'
import { RichEditable } from './RichEditable'

const base = { onChange: () => {}, ariaLabel: 'Nagłówek', marker: 'data-slide-edit' }

describe('RichEditable', () => {
  it('pole contentEditable="true" z rolą, nazwą i znacznikiem', () => {
    const tag = openingTag(render(h(RichEditable, { ...base, value: 'Ala', multiline: true, placeholder: 'Tytuł' })), '<div')
    // SSR pisze nazwy atrybutów jak w JSX; HTML i tak ignoruje wielkość liter.
    expect(tag).toContain('contentEditable="true"')
    expect(tag).toContain('role="textbox"')
    expect(tag).toContain('aria-label="Nagłówek"')
    expect(tag).toContain('aria-multiline="true"')
    expect(tag).toContain('data-slide-edit=""')
    expect(tag).toContain('data-rich-field=""')
    expect(tag).toContain('data-placeholder="Tytuł"')
    expect(tag).toContain('white-space:pre-line')
    expect(tag).not.toContain('data-empty')
    expect(tag).not.toContain('data-alignable')
  })

  it('puste pole ma data-empty (także wartość z samymi znacznikami)', () => {
    expect(openingTag(render(h(RichEditable, { ...base, value: '' })), '<div')).toContain('data-empty=""')
    expect(openingTag(render(h(RichEditable, { ...base, value: '' })), '<div')).toContain('data-empty=""')
  })

  it('alignable daje data-alignable, marker plakatu i własny tag', () => {
    const html = render(h(RichEditable, { ...base, value: 'x', as: 'h2', alignable: true, marker: 'data-poster-edit' }))
    const tag = openingTag(html, '<h2')
    expect(tag).toContain('data-alignable=""')
    expect(tag).toContain('data-poster-edit=""')
    expect(tag).not.toContain('data-slide-edit')
  })

  it('treść niekontrolowana: SSR nie rysuje dzieci', () => {
    expect(render(h(RichEditable, { ...base, value: 'Ala' }))).toMatch(/><\/div>$/)
  })
})
