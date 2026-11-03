// Operacje na zakresie tekstu z formatowaniem. Offsety dotyczą toPlain(value), '\n' to 1 znak.
// Wszystkie funkcje przyjmują i zwracają serializowany string.

import { parseRich, serializeRich, stripControl, type Align, type RichDoc } from './format'

interface Cell { ch: string; marks: number } // jeden znak (jednostka UTF-16); '\n' rozdziela wiersze
interface Flat { cells: Cell[]; aligns: Align[] } // aligns[i] = wyrównanie i-tego wiersza

function expand(value: string): Flat {
  const cells: Cell[] = []
  const aligns: Align[] = []
  parseRich(value).forEach((line, i) => {
    if (i > 0) cells.push({ ch: '\n', marks: 0 })
    aligns.push(line.align)
    for (const run of line.runs) for (let k = 0; k < run.text.length; k++) cells.push({ ch: run.text[k], marks: run.marks })
  })
  return { cells, aligns }
}

function collapse({ cells, aligns }: Flat): string {
  const doc: RichDoc = [{ align: aligns[0] ?? 'left', runs: [] }]
  for (const c of cells) {
    if (c.ch === '\n') doc.push({ align: aligns[doc.length] ?? 'left', runs: [] })
    else doc[doc.length - 1].runs.push({ text: c.ch, marks: c.marks })
  }
  return serializeRich(doc)
}

// Odwrócony zakres (end < start) zwija się do kursora w start.
function clamp(flat: Flat, start: number, end: number): [number, number] {
  const s = Math.max(0, Math.min(start, flat.cells.length))
  const e = Math.max(s, Math.min(end, flat.cells.length))
  return [s, e]
}

/** Numer wiersza, w którym leży offset. */
function lineOf(cells: Cell[], offset: number): number {
  let n = 0
  for (let i = 0; i < offset; i++) if (cells[i].ch === '\n') n++
  return n
}

/** Indeksy wierszy dotkniętych zakresem: z choć jednym znakiem [s, e) (znak '\n' należy do swojego wiersza), przy pustym zakresie wiersz kursora. */
function touchedLines(cells: Cell[], s: number, e: number): number[] {
  if (s === e) return [lineOf(cells, s)]
  const first = lineOf(cells, s)
  return Array.from({ length: lineOf(cells, e - 1) - first + 1 }, (_, i) => first + i)
}

export function marksIn(value: string, start: number, end: number): number {
  const flat = expand(value)
  const [s, e] = clamp(flat, start, end)
  let acc = -1
  for (let i = s; i < e; i++) if (flat.cells[i].ch !== '\n') acc &= flat.cells[i].marks
  return acc === -1 ? 0 : acc
}

function mapMarks(value: string, start: number, end: number, fn: (marks: number) => number): string {
  const flat = expand(value)
  const [s, e] = clamp(flat, start, end)
  for (let i = s; i < e; i++) if (flat.cells[i].ch !== '\n') flat.cells[i].marks = fn(flat.cells[i].marks)
  return collapse(flat)
}

export function toggleMark(value: string, start: number, end: number, mark: number): string {
  return marksIn(value, start, end) & mark
    ? mapMarks(value, start, end, (m) => m & ~mark)
    : mapMarks(value, start, end, (m) => m | mark)
}

export function clearMarks(value: string, start: number, end: number): string {
  return mapMarks(value, start, end, () => 0)
}

export function alignIn(value: string, start: number, end: number): Align | null {
  const flat = expand(value)
  const [s, e] = clamp(flat, start, end)
  const set = new Set(touchedLines(flat.cells, s, e).map((i) => flat.aligns[i]))
  return set.size === 1 ? [...set][0] : null
}

export function setAlign(value: string, start: number, end: number, align: Align): string {
  const flat = expand(value)
  const [s, e] = clamp(flat, start, end)
  for (const i of touchedLines(flat.cells, s, e)) flat.aligns[i] = align
  return collapse(flat)
}

/** Marks dziedziczone przez tekst wstawiany w miejscu s: znak przed, na początku wiersza znak po, w pustym wierszu 0. */
function inheritedMarks(cells: Cell[], s: number): number {
  if (s > 0 && cells[s - 1].ch !== '\n') return cells[s - 1].marks
  if (s < cells.length && cells[s].ch !== '\n') return cells[s].marks
  return 0
}

/** Zastępuje [s, e) już oczyszczonym tekstem; nowe wiersze dziedziczą align wiersza, w którym zaczyna się zakres. */
function replaceRange(flat: Flat, s: number, e: number, text: string): number {
  const marks = inheritedMarks(flat.cells, s)
  const line = lineOf(flat.cells, s)
  const removed = flat.cells.slice(s, e).filter((c) => c.ch === '\n').length
  const cells: Cell[] = text.split('').map((ch) => ({ ch, marks: ch === '\n' ? 0 : marks }))
  flat.cells.splice(s, e - s, ...cells)
  const added = cells.filter((c) => c.ch === '\n').length
  flat.aligns.splice(line + 1, removed, ...Array<Align>(added).fill(flat.aligns[line]))
  return s + cells.length
}

function cleanText(text: string, multiline: boolean): string {
  const t = stripControl(text)
  return multiline ? t.replace(/\r\n?/g, '\n') : t.replace(/\s*[\r\n]+\s*/g, ' ')
}

export function insertPlain(
  value: string, start: number, end: number, text: string, multiline: boolean,
): { value: string; caret: number } {
  const flat = expand(value)
  const [s, e] = clamp(flat, start, end)
  const caret = replaceRange(flat, s, e, cleanText(text, multiline))
  return { value: collapse(flat), caret }
}

export function splitLine(value: string, start: number, end: number): { value: string; caret: number } {
  return insertPlain(value, start, end, '\n', true)
}

// Wstawienie '\n' bywa niejednoznaczne w diffie (np. 'aa' -> 'a\na'); edytor contentEditable używa splitLine.
export function applyPlainEdit(value: string, nextPlain: string): string {
  const flat = expand(value)
  const old = flat.cells.map((c) => c.ch).join('')
  const max = Math.min(old.length, nextPlain.length)
  let p = 0
  while (p < max && old[p] === nextPlain[p]) p++
  let q = 0
  while (q < max - p && old[old.length - 1 - q] === nextPlain[nextPlain.length - 1 - q]) q++
  replaceRange(flat, p, old.length - q, cleanText(nextPlain.slice(p, nextPlain.length - q), true))
  return collapse(flat)
}

/**
 * Wartość po edycji w DOM (`read`) względem poprzedniej (`prev`). Zmieniony fragment
 * to różnica wspólnego początku i końca. Pole jednowierszowe: tylko w nim '\n'
 * (ciąg '\n') staje się spacją - wiersze już zapisane zostają. `keepAligns`: DOM
 * pola inline nie zna wyrównań, więc wiersze biorą je z `prev`.
 */
export function mergeDomEdit(prev: string, read: string, opts: { multiline: boolean; keepAligns: boolean }): string {
  const before = expand(prev)
  const after = expand(read)
  const old = before.cells.map((c) => c.ch).join('')
  const now = after.cells.map((c) => c.ch).join('')
  const max = Math.min(old.length, now.length)
  let p = 0
  while (p < max && old[p] === now[p]) p++
  let q = 0
  while (q < max - p && old[old.length - 1 - q] === now[now.length - 1 - q]) q++
  const end = now.length - q

  const cells: Cell[] = []
  const aligns: Align[] = [after.aligns[0]]
  let line = 0
  let added = 0
  for (let i = 0; i < after.cells.length; i++) {
    const c = after.cells[i]
    if (c.ch !== '\n') {
      cells.push(c)
      continue
    }
    line++
    const inserted = i >= p && i < end
    if (opts.multiline || !inserted) {
      cells.push(c)
      aligns.push(after.aligns[line])
      if (inserted) added++
    } else if (!(i > p && now[i - 1] === '\n')) {
      cells.push({ ch: ' ', marks: inheritedMarks(after.cells, i) })
    }
  }
  if (!opts.keepAligns) return collapse({ cells, aligns })
  const at = lineOf(before.cells, p)
  const removed = before.cells.slice(p, old.length - q).filter((c) => c.ch === '\n').length
  const kept = before.aligns.slice()
  kept.splice(at + 1, removed, ...Array<Align>(added).fill(kept[at]))
  return collapse({ cells, aligns: kept })
}
