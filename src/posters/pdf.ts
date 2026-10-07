export interface PdfImage {
  widthPx: number
  heightPx: number
  widthPt: number
  heightPt: number
  // Bajty RGB (3 na piksel) już spakowane zlib/deflate - patrz export.ts.
  imageData: Uint8Array
}

// Jednostronicowy PDF 1.4 z jednym obrazem RGB rozciągniętym na całą stronę.
// Pisany ręcznie, żeby nie dokładać biblioteki: 5 obiektów (katalog, drzewo
// stron, strona, obraz, strumień treści), tabela xref i trailer. Cały tekst
// struktury to ASCII, więc długość stringa = liczba bajtów.
export function buildPdf({ widthPx, heightPx, widthPt, heightPt, imageData }: PdfImage): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0

  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part
    chunks.push(bytes)
    length += bytes.length
  }
  const startObj = (n: number) => {
    offsets[n] = length
    push(`${n} 0 obj\n`)
  }
  const w = widthPt.toFixed(2)
  const h = heightPt.toFixed(2)

  push('%PDF-1.4\n')

  startObj(1)
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  startObj(2)
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  startObj(3)
  push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`)

  startObj(4)
  push(`<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${imageData.length} >>\nstream\n`)
  push(imageData)
  push('\nendstream\nendobj\n')

  const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`
  startObj(5)
  push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)

  const xrefAt = length
  // Każdy wpis xref ma dokładnie 20 bajtów (stąd spacja przed \n).
  push('xref\n0 6\n0000000000 65535 f \n')
  for (let n = 1; n <= 5; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`)

  const out = new Uint8Array(length)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}
