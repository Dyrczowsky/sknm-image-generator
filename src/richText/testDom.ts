// Atrapa DOM do testów (środowisko bez jsdom): tylko to, czego używają
// dom.ts i field.ts - węzły, atrybuty, styl, zaznaczenie i fokus.

export class FakeNode {
  childNodes: FakeNode[] = []
  attrs = new Map<string, string>()
  style: Record<string, string> = {}
  ownerDocument: FakeDocument = fakeDocument
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
  toggleAttribute(name: string, force: boolean) {
    if (force) this.attrs.set(name, '')
    else this.attrs.delete(name)
  }
  contains(node: FakeNode): boolean {
    return node === this || this.childNodes.some((child) => child.contains(node))
  }
  blur() {
    if (fakeDocument.activeElement === this) fakeDocument.activeElement = null
  }
}

export interface FakeRange {
  startContainer: FakeNode
  startOffset: number
  endContainer: FakeNode
  endOffset: number
  setStart(node: FakeNode, offset: number): void
  setEnd(node: FakeNode, offset: number): void
}

function createRange(): FakeRange {
  const range: FakeRange = {
    startContainer: null as unknown as FakeNode,
    startOffset: 0,
    endContainer: null as unknown as FakeNode,
    endOffset: 0,
    setStart(node, offset) {
      range.startContainer = node
      range.startOffset = offset
    },
    setEnd(node, offset) {
      range.endContainer = node
      range.endOffset = offset
    },
  }
  return range
}

const selection = {
  ranges: [] as FakeRange[],
  get rangeCount() {
    return selection.ranges.length
  },
  getRangeAt: (i: number) => selection.ranges[i],
  removeAllRanges: () => {
    selection.ranges = []
  },
  addRange: (range: FakeRange) => {
    selection.ranges.push(range)
  },
}

export const fakeDocument = {
  activeElement: null as FakeNode | null,
  createElement: (tag: string) => new FakeNode(1, tag.toUpperCase()),
  createTextNode: (text: string) => new FakeNode(3, '#text', text),
  createRange,
  getSelection: () => selection,
}
type FakeDocument = typeof fakeDocument

export const t = (text: string) => fakeDocument.createTextNode(text)
export function e(tag: string, attrs: Record<string, string>, ...children: FakeNode[]) {
  const node = fakeDocument.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  node.childNodes = children
  return node
}
export const root = (...children: FakeNode[]) => e('div', {}, ...children)
export const asEl = (node: FakeNode) => node as unknown as HTMLElement
export const asNode = (node: FakeNode) => node as unknown as Node

/** Ustawia zaznaczenie (punkty DOM) w atrapie. */
export function select(start: [FakeNode, number], end: [FakeNode, number] = start) {
  const range = createRange()
  range.setStart(...start)
  range.setEnd(...end)
  selection.removeAllRanges()
  selection.addRange(range)
}

export function currentRange(): FakeRange | undefined {
  return selection.ranges[0]
}

// Zapis drzewa do porównań: atrybuty i styl w stałej kolejności.
export function html(node: FakeNode): string {
  if (node.nodeType === 3) return node.nodeValue ?? ''
  const attrs = [...node.attrs].map(([k, v]) => ` ${k}="${v}"`).join('')
  const style = Object.entries(node.style).map(([k, v]) => `${k}:${v}`).join(';')
  const tag = node.nodeName.toLowerCase()
  if (tag === 'br') return '<br>'
  return `<${tag}${attrs}${style ? ` style="${style}"` : ''}>${node.childNodes.map(html).join('')}</${tag}>`
}
export const inner = (node: FakeNode) => node.childNodes.map(html).join('')
