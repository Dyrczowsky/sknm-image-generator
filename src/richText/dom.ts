// Most między DOM pola contentEditable a zapisem tekstu z formatowaniem.
// Kanoniczny DOM (rysuje renderDoc):
// - bez wyrównania (albo inline): węzły tekstowe z '\n' (rodzic ma
//   `white-space: pre-line`) i `<span data-marks="N" style=…>` dla runów
//   z formatowaniem; pusty ostatni wiersz dostaje końcowy `<br>`, żeby był widoczny;
// - z wyrównaniem: każdy wiersz to `<div data-align=…>` z runami, pusty wiersz `<div><br></div>`.
// readDoc czyta też to, co dokłada przeglądarka (`<b>`, `<div>`, `<br>`; spany ze stylem bez formatowania).
// Używa tylko podstawowego API węzłów (testy działają na atrapie DOM).

import { hasAlignment, MARK, parseRich, serializeRich, stripControl } from './format'
import type { Align, RichLine, RichRun } from './format'
import { runStyle } from './runStyle'

const ELEMENT = 1
const TEXT = 3
const BLOCKS = new Set(['DIV', 'P'])
const ALIGNS: readonly string[] = ['left', 'center', 'right']

export interface Offsets { start: number; end: number }

/** Tekst węzła po normalizacji (twarde spacje, \r, znaki sterujące) i indeksy znaków w surowym tekście. */
function normalize(raw: string): { text: string; map: number[] } {
  let text = ''
  const map: number[] = []
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (ch === '\r') {
      text += '\n'
      map.push(i)
      if (raw[i + 1] === '\n') i++
    } else if (stripControl(ch)) {
      text += ch === '\u00a0' ? ' ' : ch
      map.push(i)
    }
  }
  map.push(raw.length)
  return { text, map }
}

interface TextSlot { node: Node; start: number; len: number; map: number[]; endsNL: boolean }
interface Anchor { node: Node; offset: number; pos: number } // miejsce przy <br> (pusty wiersz)

interface Walk {
  lines: RichLine[]
  pos: number // długość tekstu (z '\n') przeczytanego do tej pory
  pending: boolean // po bloku: następna treść zaczyna nowy wiersz
  slots: (TextSlot | Anchor)[]
  probe?: { node: Node; offset: number }
  found?: number
}

function newLine(w: Walk, align: Align) {
  w.lines.push({ align, runs: [] })
  w.pos++
}

function flush(w: Walk, align: Align) {
  if (!w.pending) return
  w.pending = false
  newLine(w, align)
}

function appendChar(line: RichLine, ch: string, marks: number) {
  const last: RichRun | undefined = line.runs[line.runs.length - 1]
  if (last && last.marks === marks) last.text += ch
  else line.runs.push({ text: ch, marks })
}

function attr(node: Node, name: string): string | null {
  return (node as Element).getAttribute(name)
}

/**
 * Formatowanie elementu: nasz span ma data-marks, a z obcych ufamy tylko
 * znacznikom semantycznym (<b>, <i>, <u>, <s>…). Styl inline obcych spanów
 * pomijamy: Chrome przy scalaniu wierszy przepisuje do nich wyliczony styl
 * otoczenia (np. font-weight 800 tytułu), który formatowaniem nie jest.
 */
function elementMarks(node: Node, marks: number): number {
  const own = attr(node, 'data-marks')
  if (own !== null && /^\d+$/.test(own)) return Number(own) & 31
  let m = marks
  const name = node.nodeName
  if (name === 'B' || name === 'STRONG') m |= MARK.bold
  if (name === 'I' || name === 'EM') m |= MARK.italic
  if (name === 'U') m |= MARK.underline
  if (name === 'S' || name === 'STRIKE' || name === 'DEL') m |= MARK.strike
  return m
}

function checkProbe(w: Walk, node: Node, offset: number) {
  if (w.found === undefined && w.probe?.node === node && w.probe.offset === offset) w.found = w.pos
}

function walkText(w: Walk, node: Node, marks: number, align: Align) {
  const raw = node.nodeValue ?? ''
  const { text, map } = normalize(raw)
  if (text) flush(w, align)
  if (w.found === undefined && w.probe?.node === node) {
    w.found = w.pos + normalize(raw.slice(0, w.probe.offset)).text.length
  }
  if (!text) return
  w.slots.push({ node, start: w.pos, len: text.length, map, endsNL: text.endsWith('\n') })
  // Jednostki UTF-16, nie punkty kodowe: offsety w ops liczą tak samo.
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n') newLine(w, align)
    else {
      appendChar(w.lines[w.lines.length - 1], ch, marks)
      w.pos++
    }
  }
}

function walkChildren(w: Walk, parent: Node, marks: number, align: Align, blockish: boolean) {
  const kids = parent.childNodes
  for (let i = 0; i < kids.length; i++) {
    checkProbe(w, parent, i)
    const node = kids[i]
    if (node.nodeType === TEXT) walkText(w, node, marks, align)
    else if (node.nodeType !== ELEMENT) continue
    else if (node.nodeName === 'BR') {
      // Końcowy <br> w bloku to placeholder przeglądarki, nie nowy wiersz.
      let trailing = blockish
      for (let k = i + 1; trailing && k < kids.length; k++) {
        trailing = kids[k].nodeType === TEXT && !normalize(kids[k].nodeValue ?? '').text
      }
      if (!trailing) flush(w, align)
      w.slots.push({ node: parent, offset: i, pos: w.pos })
      if (!trailing) newLine(w, align)
    } else if (BLOCKS.has(node.nodeName)) {
      flush(w, align)
      if (w.lines[w.lines.length - 1].runs.length) newLine(w, align)
      const own = attr(node, 'data-align')
      const blockAlign = own !== null && ALIGNS.includes(own) ? (own as Align) : align
      w.lines[w.lines.length - 1].align = blockAlign
      walkChildren(w, node, marks, blockAlign, true)
      w.pending = true
    } else {
      walkChildren(w, node, elementMarks(node, marks), align, false)
    }
  }
  checkProbe(w, parent, kids.length)
}

function walk(el: HTMLElement, probe?: Walk['probe']): Walk {
  const w: Walk = { lines: [{ align: 'left', runs: [] }], pos: 0, pending: false, slots: [], probe }
  walkChildren(w, el, 0, 'left', true)
  return w
}

/** Zawartość pola jako serializowany string. */
export function readDoc(el: HTMLElement): string {
  return serializeRich(walk(el).lines)
}

/** Offset (w toPlain) punktu DOM wewnątrz pola. */
export function offsetAt(el: HTMLElement, node: Node, offset: number): number {
  const w = walk(el, { node, offset })
  return w.found ?? w.pos
}

/** Punkt DOM dla offsetu. Na granicy runów wcześniejszy węzeł (jak dziedziczenie stylu w ops), po '\n' następny wiersz. */
export function pointAt(el: HTMLElement, offset: number): { node: Node; offset: number } {
  const w = walk(el)
  const target = Math.max(0, Math.min(offset, w.pos))
  for (const slot of w.slots) {
    if ('len' in slot) {
      const end = slot.start + slot.len
      if (target < slot.start || target > end || (target === end && slot.endsNL)) continue
      return { node: slot.node, offset: slot.map[target - slot.start] }
    }
    if (slot.pos === target) return { node: slot.node, offset: slot.offset }
  }
  return { node: el, offset: el.childNodes.length }
}

function runsCanonical(parent: Node): boolean {
  const kids = parent.childNodes
  for (let i = 0; i < kids.length; i++) {
    const node = kids[i]
    if (node.nodeType === TEXT) continue
    if (node.nodeName === 'BR' && i === kids.length - 1) continue
    if (node.nodeName !== 'SPAN' || attr(node, 'data-marks') === null) return false
    for (let k = 0; k < node.childNodes.length; k++) if (node.childNodes[k].nodeType !== TEXT) return false
  }
  return true
}

/** Czy DOM ma kształt rysowany przez renderDoc dla tej wartości (inaczej przerysowujemy). */
export function isCanonical(el: HTMLElement, value: string, inline: boolean): boolean {
  if (inline || !hasAlignment(parseRich(value))) return runsCanonical(el)
  const kids = el.childNodes
  for (let i = 0; i < kids.length; i++) {
    const line = kids[i]
    const align = line.nodeName === 'DIV' ? attr(line, 'data-align') : null
    if (align === null || !ALIGNS.includes(align) || !runsCanonical(line)) return false
  }
  return true
}

/** Rysuje wartość w polu (zastępuje całą zawartość). */
export function renderDoc(el: HTMLElement, value: string, opts: { inline: boolean }): void {
  const doc = parseRich(value)
  const d = el.ownerDocument
  const nodes: Node[] = []
  let text = ''
  const flushText = () => {
    if (text) nodes.push(d.createTextNode(text))
    text = ''
  }
  const pushRuns = (runs: RichRun[]) => {
    for (const run of runs) {
      if (!run.marks) {
        text += run.text
        continue
      }
      flushText()
      const span = d.createElement('span')
      span.setAttribute('data-marks', String(run.marks))
      Object.assign(span.style, runStyle(run.marks))
      span.appendChild(d.createTextNode(run.text))
      nodes.push(span)
    }
    flushText()
  }

  if (!opts.inline && hasAlignment(doc)) {
    const lines: Node[] = []
    for (const line of doc) {
      const div = d.createElement('div')
      div.setAttribute('data-align', line.align)
      if (line.align !== 'left') div.style.textAlign = line.align
      if (line.runs.length) {
        pushRuns(line.runs)
        div.replaceChildren(...nodes.splice(0))
      } else {
        div.appendChild(d.createElement('br'))
      }
      lines.push(div)
    }
    el.replaceChildren(...lines)
    return
  }

  doc.forEach((line, i) => {
    if (i > 0) text += '\n'
    for (const run of line.runs) {
      if (run.marks) pushRuns([run])
      else text += run.text
    }
  })
  flushText()
  if (doc.length > 1 && !doc[doc.length - 1].runs.length) nodes.push(d.createElement('br'))
  el.replaceChildren(...nodes)
}

/** Zaznaczenie zakresu DOM jako offsety w polu; null, gdy zakres wychodzi poza pole. */
export function rangeOffsets(el: HTMLElement, range: AbstractRange): Offsets | null {
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null
  const a = offsetAt(el, range.startContainer, range.startOffset)
  const b = offsetAt(el, range.endContainer, range.endOffset)
  return { start: Math.min(a, b), end: Math.max(a, b) }
}

export function getOffsets(el: HTMLElement): Offsets | null {
  const selection = el.ownerDocument.getSelection()
  if (!selection || !selection.rangeCount) return null
  return rangeOffsets(el, selection.getRangeAt(0))
}

export function setOffsets(el: HTMLElement, start: number, end: number): void {
  const selection = el.ownerDocument.getSelection()
  if (!selection) return
  const range = el.ownerDocument.createRange()
  const a = pointAt(el, start)
  const b = pointAt(el, end)
  range.setStart(a.node, a.offset)
  range.setEnd(b.node, b.offset)
  selection.removeAllRanges()
  selection.addRange(range)
}

export function placeCaretAtEnd(el: HTMLElement): void {
  const selection = el.ownerDocument.getSelection()
  if (!selection) return
  const range = el.ownerDocument.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}
