import { describe, expect, it } from 'vitest'
import { buildPdf, buildPdfPages } from './pdf'
import { buildSrgbProfile } from './srgbProfile'

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

  it('obraz: sRGB (ICCBased), 8 bitów, Flate, wymiary w px, długość strumienia', () => {
    const { text } = build()
    expect(text).toContain('/Subtype /Image /Width 2480 /Height 3508 /ColorSpace [/ICCBased 6 0 R] /BitsPerComponent 8 /Filter /FlateDecode /Length 5')
  })

  it('bajty obrazu trafiają do pliku bez zmian', () => {
    const { bytes, text } = build()
    const at = text.indexOf('stream\n') + 'stream\n'.length
    expect(Array.from(bytes.slice(at, at + 5))).toEqual([1, 2, 3, 250, 251])
  })

  it('profil ICC sRGB jest osadzony w całości', () => {
    const { bytes, text } = build()
    const profile = buildSrgbProfile()
    const at = text.indexOf(`<< /N 3 /Alternate /DeviceRGB /Length ${profile.length} >>\nstream\n`)
    expect(at).toBeGreaterThan(-1)
    const start = text.indexOf('stream\n', at) + 'stream\n'.length
    expect(Array.from(bytes.slice(start, start + profile.length))).toEqual(Array.from(profile))
  })

  it('obraz jest rozciągnięty na całą stronę', () => {
    expect(build().text).toContain('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q')
  })

  it('xref: każdy offset wskazuje na swój obiekt, startxref na tabelę', () => {
    const { text } = build()
    const startxref = Number(/startxref\n(\d+)\n/.exec(text)?.[1])
    expect(text.slice(startxref, startxref + 4)).toBe('xref')
    const lines = text.slice(startxref).split('\n')
    expect(lines[1]).toBe('0 7')
    expect(lines[2]).toBe('0000000000 65535 f ')
    for (let n = 1; n <= 6; n++) {
      const entry = lines[2 + n]
      expect(entry).toMatch(/^\d{10} 00000 n $/)
      const offset = Number(entry.slice(0, 10))
      expect(text.slice(offset, offset + `${n} 0 obj`.length)).toBe(`${n} 0 obj`)
    }
    expect(text).toContain('trailer\n<< /Size 7 /Root 1 0 R >>')
  })
})

describe('buildPdfPages', () => {
  const page = (widthPx: number, heightPx: number, widthPt: number, heightPt: number, fill: number) => ({
    widthPx, heightPx, widthPt, heightPt, imageData: new Uint8Array([fill, fill, fill]),
  })
  const build3 = () => {
    const bytes = buildPdfPages([page(100, 50, 200, 100, 7), page(300, 400, 150.5, 200.25, 8), page(10, 10, 72, 72, 9)])
    return { bytes, text: new TextDecoder('latin1').decode(bytes) }
  }

  it('/Count, Kids w kolejności i trzy obiekty strony', () => {
    const { text } = build3()
    expect(text).toContain('/Type /Pages /Kids [3 0 R 6 0 R 9 0 R] /Count 3')
    expect(text.match(/\/Type \/Page /g)).toHaveLength(3)
  })

  it('trzy obrazy z właściwymi wymiarami, każdy z tym samym profilem ICC', () => {
    const { text } = build3()
    expect(text.match(/\/Subtype \/Image/g)).toHaveLength(3)
    expect(text).toContain('/Width 100 /Height 50 /ColorSpace [/ICCBased 12 0 R]')
    expect(text).toContain('/Width 300 /Height 400 /ColorSpace [/ICCBased 12 0 R]')
    expect(text).toContain('/Width 10 /Height 10 /ColorSpace [/ICCBased 12 0 R]')
  })

  it('dokładnie jeden profil ICC', () => {
    expect(build3().text.match(/\/N 3 \/Alternate/g)).toHaveLength(1)
  })

  it('każda strona ma własny MediaBox i treść', () => {
    const { text } = build3()
    expect(text).toContain('/MediaBox [0 0 200.00 100.00]')
    expect(text).toContain('/MediaBox [0 0 150.50 200.25]')
    expect(text).toContain('/MediaBox [0 0 72.00 72.00]')
    expect(text).toContain('q 150.50 0 0 200.25 0 0 cm /Im0 Do Q')
  })

  it('xref: 13 wpisów, każdy offset wskazuje na swój obiekt, startxref na tabelę', () => {
    const { text } = build3()
    const startxref = Number(/startxref\n(\d+)\n/.exec(text)?.[1])
    expect(text.slice(startxref, startxref + 4)).toBe('xref')
    const lines = text.slice(startxref).split('\n')
    expect(lines[1]).toBe('0 13')
    expect(lines[2]).toBe('0000000000 65535 f ')
    for (let n = 1; n <= 12; n++) {
      const entry = lines[2 + n]
      expect(entry).toMatch(/^\d{10} 00000 n $/)
      const offset = Number(entry.slice(0, 10))
      expect(text.slice(offset, offset + `${n} 0 obj`.length)).toBe(`${n} 0 obj`)
    }
    expect(text).toContain('trailer\n<< /Size 13 /Root 1 0 R >>')
  })

  it('pusta lista stron rzuca błąd', () => {
    expect(() => buildPdfPages([])).toThrow('co najmniej jedną stronę')
  })
})
