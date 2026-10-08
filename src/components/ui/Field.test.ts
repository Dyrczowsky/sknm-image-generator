import { describe, expect, it } from 'vitest'
import { Field } from './Field'
import { Input, Select, Textarea } from './Input'
import { h, openingTag, render } from './testUtils'

const attr = (tag: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1]

describe('Field + Input', () => {
  it('etykieta to <label for> wskazujący wygenerowane id kontrolki', () => {
    const html = render(h(Field, { label: 'Tytuł' }, h(Input, { defaultValue: 'Wykład' })))
    const id = attr(openingTag(html, '<input'), 'id')
    expect(id).toBeTruthy()
    expect(attr(openingTag(html, '<label'), 'for')).toBe(id)
    expect(html).toContain('>Tytuł</label>')
  })

  it('dwa pola dostają różne id', () => {
    const html = render(h('div', null, h(Field, { label: 'A' }, h(Input, null)), h(Field, { label: 'B' }, h(Input, null))))
    const ids = [...html.matchAll(/<input[^>]* id="([^"]+)"/g)].map((m) => m[1])
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('podane id wygrywa i trafia też do etykiety', () => {
    const html = render(h(Field, { label: 'Kod QR', id: 'qr' }, h(Input, null)))
    expect(openingTag(html, '<input')).toContain('id="qr"')
    expect(openingTag(html, '<label')).toContain('for="qr"')
  })

  it('podpowiedź jest podpięta przez aria-describedby, bez aria-invalid', () => {
    const html = render(h(Field, { label: 'Tytuł', hint: 'Najwyżej dwie linie.' }, h(Input, null)))
    const input = openingTag(html, '<input')
    const hintId = attr(input, 'aria-describedby')
    expect(hintId).toBeTruthy()
    expect(html).toContain(`<p id="${hintId}"`)
    expect(html).toContain('Najwyżej dwie linie.')
    expect(input).not.toContain('aria-invalid=')
  })

  it('błąd: aria-invalid, role="alert", ikona obok tekstu i opis przed podpowiedzią', () => {
    const html = render(h(Field, { label: 'Link', hint: 'Adres strony.', error: 'Zacznij od https://' }, h(Input, { type: 'url' })))
    const input = openingTag(html, '<input')
    expect(input).toContain('aria-invalid="true"')
    const [errorId, hintId] = (attr(input, 'aria-describedby') ?? '').split(' ')
    expect(html).toMatch(new RegExp(`<p id="${errorId}"[^>]*role="alert"[^>]*><svg`))
    expect(html).toContain('Zacznij od https://')
    expect(html).toContain(`<p id="${hintId}"`)
  })

  it('required: natywny atrybut na kontrolce, gwiazdka ukryta przed czytnikiem', () => {
    const html = render(h(Field, { label: 'Data', required: true }, h(Input, { type: 'date' })))
    expect(openingTag(html, '<input')).toContain('required=""')
    expect(html).toMatch(/<span aria-hidden="true"[^>]*> \*<\/span>/)
  })

  it('labelHidden: etykieta zostaje w drzewie jako sr-only', () => {
    const html = render(h(Field, { label: 'Nazwa projektu', labelHidden: true }, h(Input, null)))
    expect(html).toMatch(/<label for="[^"]+" class="sr-only">Nazwa projektu<\/label>/)
  })

  it('action ląduje obok etykiety, poza <label>', () => {
    const html = render(h(Field, { label: 'Prelegent', action: h('button', { type: 'button' }, 'Ukryj') }, h(Input, null)))
    expect(html).toMatch(/<\/label><span[^>]*><button type="button">Ukryj<\/button><\/span>/)
  })

  it('Textarea i Select biorą id i opis z Field tak samo jak Input', () => {
    const area = render(h(Field, { label: 'Opis', hint: 'Akapit.' }, h(Textarea, null)))
    expect(attr(openingTag(area, '<label'), 'for')).toBe(attr(openingTag(area, '<textarea'), 'id'))
    expect(openingTag(area, '<textarea')).toContain('aria-describedby=')

    const select = render(h(Field, { label: 'Format', error: 'Wybierz format' }, h(Select, null, h('option', { value: 'a4' }, 'A4'))))
    const tag = openingTag(select, '<select')
    expect(attr(openingTag(select, '<label'), 'for')).toBe(attr(tag, 'id'))
    expect(tag).toContain('aria-invalid="true"')
    expect(select).toContain('<option value="a4">A4</option>')
  })

  it('trzy kontrolki mają wspólny wygląd pola', () => {
    const shared = 'rounded-lg border border-field-border bg-field'
    expect(openingTag(render(h(Input, { 'aria-label': 'x' })), '<input')).toContain(shared)
    expect(openingTag(render(h(Textarea, { 'aria-label': 'x' })), '<textarea')).toContain(shared)
    expect(openingTag(render(h(Select, { 'aria-label': 'x' })), '<select')).toContain(shared)
  })

  it('poza Field kontrolka działa samodzielnie: bez id, z własnym aria-label', () => {
    const tag = openingTag(render(h(Input, { 'aria-label': 'Szukaj', size: 'sm' })), '<input')
    expect(tag).toContain('aria-label="Szukaj"')
    expect(tag).toContain('type="text"')
    expect(tag).not.toContain(' id=')
    expect(tag).not.toContain(' size=')
    expect(tag).toContain('min-[900px]:h-9')
  })

  it('Input na telefonie ma tekst 16px (bez przybliżania w iOS)', () => {
    expect(openingTag(render(h(Input, { 'aria-label': 'x' })), '<input')).toContain('text-base')
  })
})
