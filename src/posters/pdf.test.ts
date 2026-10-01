import { describe, expect, it } from 'vitest'
import { buildPdf } from './pdf'

// latin1: jeden bajt = jeden znak, więc indeksy w stringu = offsety w pliku.
const build = () => {
  const bytes = buildPdf({ widthPx: 2480, heightPx: 3508, widthPt: 595.2756, heightPt: 841.8898, imageData: new Uint8Array([1, 2, 3, 250, 251]) })
  return { bytes, text: new TextDecoder('latin1').decode(bytes) }
}

describe('buildPdf', () => {
  it('nagłówek i zakończenie pliku', () => {
    const { text } = build()
    expect(text.startsWith('%PDF-1.4\n')).toBe(true)
    expect(text.endsWith('%%EOF\n')).toBe(true)
  })

  it('MediaBox = rozmiar papieru w punktach', () => {
    expect(build().text).toContain('/MediaBox [0 0 595.28 841.89]')
  })

  it('obraz: DeviceCMYK, 8 bitów, Flate, wymiary w px, długość strumienia', () => {
    const { text } = build()
    expect(text).toContain('/Subtype /Image /Width 2480 /Height 3508 /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Filter /FlateDecode /Length 5')
  })

  it('bajty obrazu trafiają do pliku bez zmian', () => {
    const { bytes, text } = build()
    const at = text.indexOf('stream\n') + 'stream\n'.length
    expect(Array.from(bytes.slice(at, at + 5))).toEqual([1, 2, 3, 250, 251])
  })

  it('obraz jest rozciągnięty na całą stronę', () => {
    expect(build().text).toContain('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q')
  })

  it('xref: każdy offset wskazuje na swój obiekt, startxref na tabelę', () => {
    const { text } = build()
    const startxref = Number(/startxref\n(\d+)\n/.exec(text)?.[1])
    expect(text.slice(startxref, startxref + 4)).toBe('xref')
    const lines = text.slice(startxref).split('\n')
    expect(lines[1]).toBe('0 6')
    expect(lines[2]).toBe('0000000000 65535 f ')
    for (let n = 1; n <= 5; n++) {
      const entry = lines[2 + n]
      expect(entry).toMatch(/^\d{10} 00000 n $/)
      const offset = Number(entry.slice(0, 10))
      expect(text.slice(offset, offset + `${n} 0 obj`.length)).toBe(`${n} 0 obj`)
    }
    expect(text).toContain('trailer\n<< /Size 6 /Root 1 0 R >>')
  })
})
