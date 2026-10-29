import { describe, expect, it } from 'vitest'
import { h, openingTag, render } from '../../components/ui/testUtils'
import { EMPTY_FORM } from '../../editor/formState'
import { PosterEditContext, setFormPath } from '../edit'
import type { PosterEdit } from '../edit'
import { PosterText } from './PosterText'

const EDITING: PosterEdit = { editable: true, onText: () => {} }

const editable = (props: object) => render(h(PosterEditContext.Provider, { value: EDITING }, h(PosterText, props)))

describe('PosterText', () => {
  it('bez providera pusty tekst rysuje wartość zastępczą, bez contenteditable', () => {
    const html = render(h(PosterText, { path: 'title', value: '', fallback: 'X', label: 'Tytuł' }))
    expect(html).toBe('<div>X</div>')
  })

  it('bez providera zwykły tekst w podanym elemencie i stylu', () => {
    const html = render(h(PosterText, { path: 'title', value: 'Ala', fallback: 'X', as: 'h1', style: { color: 'red' }, label: 'Tytuł' }))
    expect(html).toBe('<h1 style="color:red">Ala</h1>')
  })

  it('bez providera sformatowany tekst rysuje style', () => {
    const html = render(h(PosterText, { path: 'title', value: 'Ala ma', label: 'Tytuł' }))
    expect(html).toBe('<div>Ala <span style="font-weight:bolder">ma</span></div>')
  })

  it('w edytorze: pole contentEditable z podpowiedzią z wartości zastępczej', () => {
    const tag = openingTag(editable({ path: 'title', value: '', fallback: 'X', label: 'Tytuł' }), '<div')
    expect(tag).toContain('contentEditable="true"')
    expect(tag).toContain('data-poster-edit=""')
    expect(tag).toContain('data-placeholder="X"')
    expect(tag).toContain('data-empty=""')
    expect(tag).toContain('aria-label="Tytuł"')
  })

  it('w edytorze: wyrównania tylko w polu wielowierszowym, nie w linii', () => {
    expect(openingTag(editable({ path: 'body', value: 'a', multiline: true, label: 'Treść' }), '<div')).toContain('data-alignable')
    expect(openingTag(editable({ path: 'body', value: 'a', multiline: true, inline: true, label: 'Treść' }), '<div')).not.toContain('data-alignable')
    expect(openingTag(editable({ path: 'title', value: 'a', label: 'Tytuł' }), '<div')).not.toContain('data-alignable')
  })

  it('transform: uppercase przez CSS, tekst w oryginalnej wielkości', () => {
    const html = render(h(PosterText, { path: 'badge', value: 'Nowość', transform: 'uppercase', style: { color: 'red' }, label: 'Plakietka' }))
    expect(html).toBe('<div style="color:red;text-transform:uppercase">Nowość</div>')
    expect(openingTag(editable({ path: 'badge', value: 'Nowość', transform: 'uppercase', label: 'Plakietka' }), '<div')).toContain('text-transform:uppercase')
  })
})

describe('setFormPath', () => {
  it('ustawia pole formularza', () => {
    expect(setFormPath('title', 'x')(EMPTY_FORM).title).toBe('x')
  })

  it('zmienia tylko wskazaną pozycję listy', () => {
    const form = { ...EMPTY_FORM, lists: { agenda: [{ title: 'a', time: '9' }, { title: 'b', time: '10' }], other: [{ title: 'c' }] } }
    const next = setFormPath('lists.agenda.1.title', 'x')(form)
    expect(next.lists).toEqual({ agenda: [{ title: 'a', time: '9' }, { title: 'x', time: '10' }], other: [{ title: 'c' }] })
    expect(next.lists.agenda[0]).toBe(form.lists.agenda[0])
    expect(form.lists.agenda[1].title).toBe('b')
  })

  it('nieznana ścieżka nie zmienia formularza', () => {
    expect(setFormPath('nieznane', 'x')(EMPTY_FORM)).toBe(EMPTY_FORM)
    expect(setFormPath('lists.agenda.x.title', 'x')(EMPTY_FORM)).toBe(EMPTY_FORM)
  })
})
