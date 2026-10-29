// Format zapisu tekstu z formatowaniem: jeden string, znaki z obszaru prywatnego Unicode.
// Bez U+E000 na początku string to zwykły tekst (zgodność ze starymi zapisami).

export const MARK = { bold: 1, italic: 2, underline: 4, strike: 8, accent: 16 } as const

export type Align = 'left' | 'center' | 'right'
export interface RichRun { text: string; marks: number } // text bez '\n'
export interface RichLine { align: Align; runs: RichRun[] }
export type RichDoc = RichLine[] // zawsze ≥ 1 wiersz

const RICH = ''
const CENTER = ''
const RIGHT = ''
const MARK_BASE = 0xe100
const MARK_MAX = 31

/** Czy string jest zapisem wzbogaconym. */
export function isRich(value: string): boolean {
  return value.startsWith(RICH)
}

function isStyleChar(code: number): boolean {
  return code >= MARK_BASE && code <= MARK_BASE + MARK_MAX
}

/** Znaki sterujące formatu (do pominięcia w tekście). */
function isControl(code: number): boolean {
  return (code >= 0xe000 && code <= 0xe0ff) || (code >= 0xe100 && code <= 0xe1ff)
}

function parseLine(raw: string): RichLine {
  let align: Align = 'left'
  let i = 0
  if (raw[0] === CENTER) { align = 'center'; i = 1 }
  else if (raw[0] === RIGHT) { align = 'right'; i = 1 }
  const runs: RichRun[] = []
  let marks = 0
  let text = ''
  const flush = () => {
    if (text) {
      const last = runs[runs.length - 1]
      if (last && last.marks === marks) last.text += text
      else runs.push({ text, marks })
    }
    text = ''
  }
  for (; i < raw.length; i++) {
    const code = raw.charCodeAt(i)
    if (isStyleChar(code)) { flush(); marks = code - MARK_BASE }
    else if (isControl(code)) continue // odporność: nieznane znaczniki pomijamy
    else text += raw[i]
  }
  flush()
  return { align, runs }
}

export function parseRich(value: string): RichDoc {
  if (!isRich(value)) {
    return value.split('\n').map((t) => ({ align: 'left' as const, runs: t ? [{ text: t, marks: 0 }] : [] }))
  }
  return value.slice(1).split('\n').map(parseLine)
}

export function hasFormatting(doc: RichDoc): boolean {
  return doc.some((l) => l.runs.some((r) => r.marks !== 0 && r.text !== ''))
}

export function hasAlignment(doc: RichDoc): boolean {
  return doc.some((l) => l.align !== 'left')
}

export function serializeRich(doc: RichDoc): string {
  const rich = hasFormatting(doc) || hasAlignment(doc)
  const lines = doc.map((line) => {
    // scal sąsiednie runy o tych samych stylach, pomiń puste
    const merged: RichRun[] = []
    for (const r of line.runs) {
      if (!r.text) continue
      const last = merged[merged.length - 1]
      if (last && last.marks === r.marks) last.text += r.text
      else merged.push({ text: r.text, marks: r.marks })
    }
    if (!rich) return merged.map((r) => r.text).join('')
    let out = line.align === 'center' ? CENTER : line.align === 'right' ? RIGHT : ''
    let cur = 0
    for (const r of merged) {
      if (r.marks !== cur) { out += String.fromCharCode(MARK_BASE + r.marks); cur = r.marks }
      out += r.text
    }
    return out
  })
  return (rich ? RICH : '') + lines.join('\n')
}

/** Tekst bez żadnych znaczników (wiersze rozdzielone `\n`). */
export function toPlain(value: string): string {
  return parseRich(value).map((l) => l.runs.map((r) => r.text).join('')).join('\n')
}

/** Usuwa znaki sterujące formatu z tekstu wpisanego lub wklejonego. */
export function stripControl(text: string): string {
  let out = ''
  for (const ch of text) if (!isControl(ch.charCodeAt(0))) out += ch
  return out
}
