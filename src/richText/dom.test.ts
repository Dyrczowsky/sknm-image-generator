import { describe, expect, it } from 'vitest'
import { MARK, serializeRich } from './format'
import { isCanonical, offsetAt, pointAt, readDoc, renderDoc } from './dom'

// Testy bez jsdom: minimalny DOM z tym, czego używa dom.ts.
class FakeNode {
  childNodes: FakeNode[] = []
  attrs = new Map<string, string>()
  style: Record<string, string> = {}
  ownerDocument = fakeDocument
  constructor(public nodeType: number, public nodeName: string, public nodeValue: string | null = null) {}
  appendChild(child: FakeNode) {
    this.childNodes.push(child)
    return child
  }
  replaceChildren(...children: FakeNode[]) {
    this.childNodes = children
  }
  setAttribute(name: string, value: string) {
    this.attrs.set(name, value)
  }
  getAttribute(name: string) {
    return this.attrs.get(name) ?? null
  }
}

const fakeDocument = {
  createElement: (tag: string) => new FakeNode(1, tag.toUpperCase()),
  createTextNode: (text: string) => new FakeNode(3, '#text', text),
}

const t = (text: string) => fakeDocument.createTextNode(text)
function e(tag: string, attrs: Record<string, string>, ...children: FakeNode[]) {
  const node = fakeDocument.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  node.childNodes = children
  return node
}
const root = (...children: FakeNode[]) => e('div', {}, ...children)
const asEl = (node: FakeNode) => node as unknown as HTMLElement

// Zapis drzewa do porównań: atrybuty i styl w stałej kolejności.
function html(node: FakeNode): string {
  if (node.nodeType === 3) return node.nodeValue ?? ''
  const attrs = [...node.attrs].map(([k, v]) => ` ${k}="${v}"`).join('')
  const style = Object.entries(node.style).map(([k, v]) => `${k}:${v}`).join(';')
  const tag = node.nodeName.toLowerCase()
  if (tag === 'br') return '<br>'
  return `<${tag}${attrs}${style ? ` style="${style}"` : ''}>${node.childNodes.map(html).join('')}</${tag}>`
}
const inner = (node: FakeNode) => node.childNodes.map(html).join('')

const RICH = ''
const CENTER = ''
const RIGHT = ''
const style = (marks: number) => String.fromCharCode(0xe100 + marks)
const B = MARK.bold

function rendered(value: string, inline = false) {
  const el = root()
  renderDoc(asEl(el), value, { inline })
  return el
}

describe('renderDoc', () => {
  it('zwykły tekst: jeden węzeł tekstowy z \\n', () => {
    expect(inner(rendered('Ala\nma kota'))).toBe('Ala\nma kota')
  })

  it('pusta wartość: brak dzieci', () => {
    expect(rendered('').childNodes).toEqual([])
  })

  it('run z formatowaniem: span z data-marks i stylem jak w RichText', () => {
    const el = rendered(`${RICH}a${style(B | MARK.accent)}b${style(0)}c`)
    expect(inner(el)).toBe(
      'a<span data-marks="17" style="fontWeight:bolder;color:var(--rich-accent, var(--accent))">b</span>c')
  })

  it('pusty ostatni wiersz dostaje <br>, żeby było go widać', () => {
    expect(inner(rendered('ab\n'))).toBe('ab\n<br>')
  })

  it('wyrównanie: wiersze jako div z data-align, pusty wiersz z <br>', () => {
    const el = rendered(`${RICH}${CENTER}ab\n\n${RIGHT}${style(B)}c`)
    expect(inner(el)).toBe(
      '<div data-align="center" style="textAlign:center">ab</div>'
      + '<div data-align="left"><br></div>'
      + '<div data-align="right" style="textAlign:right"><span data-marks="1" style="fontWeight:bolder">c</span></div>')
  })

  it('inline: wyrównanie pominięte, bez divów', () => {
    expect(inner(rendered(`${RICH}${CENTER}ab\ncd`, true))).toBe('ab\ncd')
  })
})

describe('readDoc', () => {
  const values = [
    '',
    'Ala ma kota',
    'a\n\nb',
    'ab\n',
    `${RICH}a${style(B)}b${style(B | MARK.italic)}c\nd`,
    `${RICH}${CENTER}ab\n\n${RIGHT}${style(B)}c`,
    `${RICH}${CENTER}\n${style(MARK.underline)}x`,
  ]
  for (const value of values) {
    it(`renderDoc → readDoc bez strat: ${JSON.stringify(value)}`, () => {
      const el = rendered(value)
      expect(readDoc(asEl(el))).toBe(value)
      expect(isCanonical(asEl(el), value, false)).toBe(true)
    })
  }

  it('twarde spacje to zwykłe spacje, \\r znika, znaki sterujące odpadają', () => {
    expect(readDoc(asEl(root(t('a b\r\nc'))))).toBe('a b\nc')
  })

  it('końcowy <br> przeglądarki nie jest nowym wierszem, środkowy jest', () => {
    expect(readDoc(asEl(root(t('ab'), e('br', {}))))).toBe('ab')
    expect(readDoc(asEl(root(t('a'), e('br', {}), t('b'))))).toBe('a\nb')
  })

  it('div przeglądarki w zwykłym polu to nowy wiersz', () => {
    expect(readDoc(asEl(root(t('a'), e('div', {}, t('b')), t('c'))))).toBe('a\nb\nc')
    expect(readDoc(asEl(root(e('div', {}, t('a')), e('div', {}, e('br', {})))))).toBe('a\n')
  })

  it('obce znaczniki przeglądarki: <b>, <i> i span ze stylem', () => {
    const el = root(e('b', {}, t('a')), e('span', { style: 'font-style: italic;' }, t('b')))
    expect(readDoc(asEl(el))).toBe(serializeRich([{ align: 'left', runs: [
      { text: 'a', marks: B }, { text: 'b', marks: MARK.italic }] }]))
  })

  it('scalone wiersze (Backspace między divami) biorą wyrównanie pierwszego', () => {
    const el = root(e('div', { 'data-align': 'center' }, t('ab'), t('cd')))
    expect(readDoc(asEl(el))).toBe(`${RICH}${CENTER}abcd`)
  })

  it('pisanie w spanie i obok niego', () => {
    const el = root(t('x'), e('span', { 'data-marks': '1' }, t('ab')), t('y'))
    expect(readDoc(asEl(el))).toBe(`${RICH}x${style(B)}ab${style(0)}y`)
  })
})

describe('isCanonical', () => {
  it('obce elementy i środkowy <br> wymagają przerysowania', () => {
    expect(isCanonical(asEl(root(e('b', {}, t('a')))), `${RICH}${style(B)}a`, false)).toBe(false)
    expect(isCanonical(asEl(root(t('a'), e('br', {}), t('b'))), 'a\nb', false)).toBe(false)
    expect(isCanonical(asEl(root(e('span', {}, t('a')))), 'a', false)).toBe(false)
  })

  it('kilka sąsiednich węzłów tekstowych i końcowy <br> są w porządku', () => {
    expect(isCanonical(asEl(root(t('a'), t('b'), e('br', {}))), 'ab', false)).toBe(true)
  })

  it('tryb musi pasować do wartości: div w polu bez wyrównania i odwrotnie', () => {
    expect(isCanonical(asEl(root(e('div', { 'data-align': 'left' }, t('a')))), 'a', false)).toBe(false)
    expect(isCanonical(asEl(root(t('a'))), `${RICH}${CENTER}a`, false)).toBe(false)
    expect(isCanonical(asEl(root(t('a'))), `${RICH}${CENTER}a`, true)).toBe(true)
  })
})

describe('offsetAt / pointAt', () => {
  it('offset w węźle tekstowym i w spanie', () => {
    const span = t('cd')
    const first = t('ab')
    const el = root(first, e('span', { 'data-marks': '1' }, span))
    expect(offsetAt(asEl(el), first as unknown as Node, 1)).toBe(1)
    expect(offsetAt(asEl(el), span as unknown as Node, 1)).toBe(3)
    expect(offsetAt(asEl(el), el as unknown as Node, 2)).toBe(4)
  })

  it('granica runów: kursor na końcu wcześniejszego węzła (dziedziczy styl znaku przed)', () => {
    const first = t('ab')
    const el = root(first, e('span', { 'data-marks': '1' }, t('cd')))
    expect(pointAt(asEl(el), 2)).toEqual({ node: first, offset: 2 })
  })

  it('po \\n kursor idzie na początek następnego wiersza', () => {
    const second = t('c')
    const el = root(t('ab\n'), e('span', { 'data-marks': '1' }, second))
    expect(pointAt(asEl(el), 3)).toEqual({ node: second, offset: 0 })
  })

  it('pusty ostatni wiersz: kursor przed końcowym <br>', () => {
    const el = rendered('ab\n')
    expect(pointAt(asEl(el), 3)).toEqual({ node: el, offset: 1 })
    expect(offsetAt(asEl(el), el as unknown as Node, 1)).toBe(3)
  })

  it('wiersze w divach: \\n między nimi liczy się jako 1 znak', () => {
    const el = rendered(`${RICH}${CENTER}ab\n\ncd`)
    const [line1, line2, line3] = el.childNodes
    expect(pointAt(asEl(el), 2)).toEqual({ node: line1.childNodes[0], offset: 2 })
    expect(pointAt(asEl(el), 3)).toEqual({ node: line2, offset: 0 })
    expect(pointAt(asEl(el), 5)).toEqual({ node: line3.childNodes[0], offset: 1 })
    expect(offsetAt(asEl(el), line3.childNodes[0] as unknown as Node, 2)).toBe(6)
    expect(offsetAt(asEl(el), line2 as unknown as Node, 0)).toBe(3)
  })

  it('twarda spacja i \\r\\n: offset w tekście znormalizowanym', () => {
    const node = t('a\r\nb')
    const el = root(node)
    expect(offsetAt(asEl(el), node as unknown as Node, 3)).toBe(2)
    expect(pointAt(asEl(el), 2)).toEqual({ node, offset: 3 })
  })

  it('poza zakresem i puste pole: koniec pola', () => {
    const empty = root()
    expect(pointAt(asEl(empty), 0)).toEqual({ node: empty, offset: 0 })
    const node = t('ab')
    expect(pointAt(asEl(root(node)), 9)).toEqual({ node, offset: 2 })
  })
})
