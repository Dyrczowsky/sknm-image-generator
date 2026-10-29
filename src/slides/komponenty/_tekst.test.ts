import { describe, expect, it } from 'vitest'
import { SlideEditContext } from '../defineSlide'
import type { SlideEdit } from '../defineSlide'
import { h, openingTag, render } from '../../components/ui/testUtils'
import { EditableText, findFitFactor, fit } from './_tekst'

const EDITING: SlideEdit = { editable: true, onText: () => {}, onOverflow: () => {} }

const editable = (props: object) => render(h(SlideEditContext.Provider, { value: EDITING }, h(EditableText, props)))

describe('EditableText', () => {
  it('poza edytorem: zwykły tekst bez contenteditable', () => {
    const html = render(h(EditableText, { path: 'quote', value: 'Ala\nma kota', as: 'p' }))
    expect(html).toBe('<p style="white-space:pre-line">Ala\nma kota</p>')
  })

  it('poza edytorem sformatowany tekst rysuje style w tym samym elemencie', () => {
    const value = '\uE000Ala \uE101ma'
    expect(render(h(EditableText, { path: 'x', value, as: 'p' }))).toBe(
      '<p style="white-space:pre-line">Ala <span style="font-weight:bolder">ma</span></p>',
    )
  })

  it('poza edytorem pusty tekst zostawia sam element', () => {
    expect(render(h(EditableText, { path: 'x', value: '' }))).toBe('<div style="white-space:pre-line"></div>')
  })

  it('w edytorze: pole tekstowe z podpowiedzią i dostępną nazwą', () => {
    const tag = openingTag(editable({ path: 'quote', value: 'Cytat', multiline: true, placeholder: 'Treść cytatu' }), '<div')
    // SSR pisze nazwy atrybutów jak w JSX; HTML i tak ignoruje wielkość liter.
    expect(tag).toContain('contentEditable="true"')
    expect(tag).toContain('data-rich-field=""')
    expect(tag).toContain('data-alignable=""')
    expect(tag).toContain('spellCheck="true"')
    expect(tag).toContain('data-slide-edit=""')
    expect(tag).toContain('role="textbox"')
    expect(tag).toContain('aria-label="Treść cytatu"')
    expect(tag).toContain('aria-multiline="true"')
    expect(tag).toContain('data-placeholder="Treść cytatu"')
    expect(tag).not.toContain('data-empty')
  })

  it('w edytorze: puste pole ma data-empty, nazwą jest ścieżka bez podpowiedzi', () => {
    const tag = openingTag(editable({ path: 'cards.2.title', value: '' }), '<div')
    expect(tag).toContain('data-empty=""')
    expect(tag).toContain('aria-label="cards.2.title"')
    expect(tag).not.toContain('aria-multiline')
  })
})

describe('fit', () => {
  it('rozmiar mnożony przez --fit', () => {
    expect(fit(74)).toBe('calc(74px * var(--fit, 1))')
  })
})

describe('findFitFactor', () => {
  it('mieści się w pełnym rozmiarze: 1, bez przepełnienia', () => {
    expect(findFitFactor(() => false)).toEqual({ factor: 1, overflowing: false })
  })

  it('nie mieści się nigdy: minimum i przepełnienie', () => {
    expect(findFitFactor(() => true)).toEqual({ factor: 0.7, overflowing: true })
    expect(findFitFactor(() => true, 0.5)).toEqual({ factor: 0.5, overflowing: true })
  })

  it('próg: największy mieszczący się mnożnik z dokładnością 0,01', () => {
    for (const threshold of [0.71, 0.8333, 0.9, 0.999]) {
      const result = findFitFactor((factor) => factor > threshold)
      expect(result.overflowing).toBe(false)
      expect(result.factor).toBeLessThanOrEqual(threshold)
      expect(threshold - result.factor).toBeLessThan(0.01)
      // Trzy miejsca po przecinku - krótki zapis w atrybucie `style`.
      expect(String(result.factor).length).toBeLessThanOrEqual(5)
    }
  })
})
