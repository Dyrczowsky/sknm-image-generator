import { describe, expect, it } from 'vitest'
import { buttonClass } from '../styles'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { h, openingTag, render } from './testUtils'

describe('Button', () => {
  it('to prawdziwy <button type="button"> z tekstem jako nazwą', () => {
    const html = render(h(Button, null, 'Zapisz'))
    expect(html).toMatch(/^<button type="button"[^>]*>Zapisz<\/button>$/)
  })

  it('type="submit" da się podać wprost', () => {
    expect(render(h(Button, { type: 'submit' }, 'Wyślij'))).toContain('type="submit"')
  })

  it('każdy wariant ma własne klasy, a rozmiar sm ma 36px na desktopie i 40px na telefonie', () => {
    const variants = ['primary', 'outline', 'ghost', 'danger', 'dangerSolid'] as const
    const classes = variants.map((variant) => buttonClass({ variant }))
    expect(new Set(classes).size).toBe(variants.length)
    expect(buttonClass({ size: 'sm' })).toContain('h-10 min-[900px]:h-9')
    expect(buttonClass({ size: 'md' })).toContain('h-11 min-[900px]:h-10')
    expect(render(h(Button, { variant: 'primary' }, 'Pobierz'))).toContain('bg-accent text-on-accent')
  })

  it('ikona jest ozdobą: aria-hidden, nazwa przycisku to sam tekst', () => {
    const html = render(h(Button, { icon: 'download' }, 'Pobierz PNG'))
    expect(html).toContain('<svg')
    expect(openingTag(html, '<svg')).toContain('aria-hidden="true"')
    expect(html).toContain('Pobierz PNG</button>')
  })

  it('disabled: natywny atrybut, bez aria-busy', () => {
    const tag = openingTag(render(h(Button, { disabled: true }, 'Zapisz')), '<button')
    expect(tag).toContain('disabled=""')
    expect(tag).not.toContain('aria-busy=')
  })

  it('busy: aria-busy + aria-disabled, ale bez `disabled` (fokus zostaje), kręciołek zamiast ikony', () => {
    const html = render(h(Button, { busy: true, icon: 'save' }, 'Zapisz'))
    const tag = openingTag(html, '<button')
    expect(tag).toContain('aria-busy="true"')
    expect(tag).toContain('aria-disabled="true"')
    expect(tag).not.toContain('disabled=""')
    expect(html).toContain('animate-spin')
    expect(html.match(/<svg/g)).toHaveLength(1)
  })

  it('busyLabel zastępuje tekst na czas pracy', () => {
    const html = render(h(Button, { busy: true, busyLabel: 'Generowanie…' }, 'Pobierz PNG'))
    expect(html).toContain('Generowanie…')
    expect(html).not.toContain('Pobierz PNG')
  })

  it('własne className dokleja się do klas wariantu, atrybuty przechodzą dalej', () => {
    const tag = openingTag(render(h(Button, { className: 'ml-auto', 'aria-pressed': true, id: 'x' }, 'Pion')), '<button')
    expect(tag).toContain('ml-auto')
    expect(tag).toContain('rounded-lg')
    expect(tag).toContain('aria-pressed="true"')
    expect(tag).toContain('id="x"')
  })
})

describe('IconButton', () => {
  it('ma nazwę dostępną i dymek z etykiety, a ikona jest ukryta przed czytnikiem', () => {
    const html = render(h(IconButton, { icon: 'help', label: 'Pomoc i skróty' }))
    const tag = openingTag(html, '<button')
    expect(tag).toContain('type="button"')
    expect(tag).toContain('aria-label="Pomoc i skróty"')
    expect(tag).toContain('title="Pomoc i skróty"')
    expect(openingTag(html, '<svg')).toContain('aria-hidden="true"')
  })

  it('jest kwadratem: 36px na desktopie, 40px na telefonie', () => {
    const tag = openingTag(render(h(IconButton, { icon: 'trash', label: 'Usuń' })), '<button')
    expect(tag).toContain('h-10 min-[900px]:h-9')
    expect(tag).toContain('w-10 px-0 min-[900px]:w-9')
  })

  it('przełącznik: aria-pressed przechodzi na przycisk', () => {
    const on = openingTag(render(h(IconButton, { icon: 'eye', label: 'Ukryj na plakacie: Tytuł', 'aria-pressed': true })), '<button')
    const off = openingTag(render(h(IconButton, { icon: 'eyeOff', label: 'Pokaż na plakacie: Tytuł', 'aria-pressed': false })), '<button')
    expect(on).toContain('aria-pressed="true"')
    expect(off).toContain('aria-pressed="false"')
  })

  it('busy i disabled jak w Button', () => {
    const busy = openingTag(render(h(IconButton, { icon: 'save', label: 'Zapisz', busy: true })), '<button')
    expect(busy).toContain('aria-busy="true"')
    expect(busy).not.toContain('disabled=""')
    expect(openingTag(render(h(IconButton, { icon: 'save', label: 'Zapisz', disabled: true })), '<button')).toContain('disabled=""')
  })
})
