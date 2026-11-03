import { buildSrgbProfile } from './srgbProfile'

export interface PdfImage {
  widthPx: number
  heightPx: number
  widthPt: number
  heightPt: number
  // Bajty RGB (3 na piksel) już spakowane zlib/deflate - patrz export.ts.
  imageData: Uint8Array
}

// Wielostronicowy PDF 1.4: każda strona to obraz sRGB rozciągnięty na całą
// stronę. Pisany ręcznie, żeby nie dokładać biblioteki. Numeracja obiektów:
// 1 katalog, 2 drzewo stron, potem trójki (strona, obraz, strumień treści)
// dla kolejnych stron, na końcu jeden wspólny profil ICC sRGB. Dla jednej
// strony daje to dokładnie 6 obiektów (profil = 6). Tabela xref i trailer
// zamykają plik. Cały tekst struktury to ASCII, więc długość stringa = liczba bajtów.
export function buildPdfPages(pages: readonly PdfImage[]): Uint8Array<ArrayBuffer> {
  if (pages.length === 0) throw new Error('PDF musi mieć co najmniej jedną stronę')

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

  const iccNum = 3 + 3 * pages.length
  const objectCount = iccNum
  const pageNum = (i: number) => 3 + 3 * i

  push('%PDF-1.4\n')

  startObj(1)
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  startObj(2)
  const kids = pages.map((_, i) => `${pageNum(i)} 0 R`).join(' ')
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`)

  pages.forEach(({ widthPx, heightPx, widthPt, heightPt, imageData }, i) => {
    const w = widthPt.toFixed(2)
    const h = heightPt.toFixed(2)
    const page = pageNum(i)

    startObj(page)
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${page + 1} 0 R >> >> /Contents ${page + 2} 0 R >>\nendobj\n`)

    startObj(page + 1)
    push(`<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace [/ICCBased ${iccNum} 0 R] /BitsPerComponent 8 /Filter /FlateDecode /Length ${imageData.length} >>\nstream\n`)
    push(imageData)
    push('\nendstream\nendobj\n')

    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`
    startObj(page + 2)
    push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)
  })

  // Profil sRGB (wspólny): obrazy są opisane jako ICCBased, a nie „jakieś RGB".
  const profile = buildSrgbProfile()
  startObj(iccNum)
  push(`<< /N 3 /Alternate /DeviceRGB /Length ${profile.length} >>\nstream\n`)
  push(profile)
  push('\nendstream\nendobj\n')

  const xrefAt = length
  // Każdy wpis xref ma dokładnie 20 bajtów (stąd spacja przed \n).
  push(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`)
  for (let n = 1; n <= objectCount; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`)

  const out = new Uint8Array(length)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}

// Jednostronicowy PDF - cienka nakładka na buildPdfPages.
export function buildPdf(image: PdfImage): Uint8Array<ArrayBuffer> {
  return buildPdfPages([image])
}
