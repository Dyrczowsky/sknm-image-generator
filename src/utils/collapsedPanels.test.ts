import { describe, expect, it } from 'vitest'
import { ALL_OPEN, parseCollapsed } from './collapsedPanels'

describe('parseCollapsed', () => {
  it('brak wpisu → wszystko rozwinięte', () => {
    expect(parseCollapsed(null)).toEqual({ template: false, form: false, history: false, notes: false })
    expect(parseCollapsed(null)).toEqual(ALL_OPEN)
  })
  it('poprawny wpis', () => {
    expect(parseCollapsed('{"template":true,"form":false,"history":true}')).toEqual({ template: true, form: false, history: true, notes: false })
  })
  it('zepsuty JSON → wszystko rozwinięte', () => {
    expect(parseCollapsed('{nie json')).toEqual(ALL_OPEN)
  })
  it('nie-obiekt (liczba, null, tablica) → wszystko rozwinięte', () => {
    for (const raw of ['5', 'null', '[true]', '"x"']) expect(parseCollapsed(raw), raw).toEqual(ALL_OPEN)
  })
  it('brakujące klucze i złe typy → false dla tych kluczy, obce klucze pomijane', () => {
    expect(parseCollapsed('{"template":true,"form":"tak","obcy":true}')).toEqual({ template: true, form: false, history: false, notes: false })
  })
})
