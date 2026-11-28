import type { Orientation } from '../types'
import { EXPORT_FORMATS, oriented } from './formats'

const MM_PER_INCH = 25.4
const CSS_DPI = 96

// Wektorowy PDF przez okno druku przeglądarki: klony statycznych węzłów trafiają
// do ukrytego iframe, każdy na osobną stronę rozmiaru `pageMm` (@page),
// skalowany do jej szerokości. Użytkownik wybiera „Zapisz jako PDF". Tekst,
// SVG i wzory zostają wektorowe, zdjęcia - w oryginalnej rozdzielczości.
export async function printPages(nodes: readonly HTMLElement[], pageMm: { w: number; h: number }): Promise<void> {
  if (nodes.length === 0) throw new Error('brak stron do druku')
  const { w, h } = pageMm
  const pageW = (w / MM_PER_INCH) * CSS_DPI
  const pageH = (h / MM_PER_INCH) * CSS_DPI

  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;left:-99999px;top:0;width:1px;height:1px;border:0'
  document.body.append(frame)
  const win = frame.contentWindow
  const doc = frame.contentDocument
  if (!win || !doc) {
    frame.remove()
    throw new Error('brak iframe do druku')
  }

  try {
    // Style (fonty, KaTeX) kopiujemy z dokumentu; <link> zostaje linkiem i ładuje się na nowo.
    const head = [...document.head.querySelectorAll('style, link[rel="stylesheet"]')].map((el) => el.outerHTML).join('')
    doc.open()
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8">${head}<style>
@page { size: ${w}mm ${h}mm; margin: 0 }
html, body { margin: 0; padding: 0; background: #fff }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact }
.page { width: ${pageW}px; height: ${pageH}px; overflow: hidden; position: relative; break-after: page }
.page:last-child { break-after: auto }
.page > div { transform-origin: top left }
</style></head><body></body></html>`,
    )
    doc.close()
    for (const node of nodes) {
      const page = doc.createElement('div')
      page.className = 'page'
      const inner = doc.createElement('div')
      inner.style.width = `${node.offsetWidth}px`
      inner.style.transform = `scale(${pageW / node.offsetWidth})`
      inner.append(doc.importNode(node, true))
      page.append(inner)
      doc.body.append(page)
    }

    await Promise.all([
      ...[...doc.querySelectorAll('link[rel="stylesheet"]')].map(
        (l) =>
          new Promise<void>((done) => {
            if ((l as HTMLLinkElement).sheet) return done()
            l.addEventListener('load', () => done(), { once: true })
            l.addEventListener('error', () => done(), { once: true })
          }),
      ),
      ...[...doc.images].map((img) => img.decode().catch(() => undefined)),
    ])
    await doc.fonts.ready

    // Chrome: print() blokuje do zamknięcia okna i wysyła afterprint. Safari
    // potrafi afterprint pominąć - wtedy kończymy, gdy główne okno wróci do fokusu.
    const done = new Promise<void>((resolve) => {
      win.addEventListener('afterprint', () => resolve(), { once: true })
      window.addEventListener('focus', () => resolve(), { once: true })
    })
    win.focus()
    win.print()
    await done
  } finally {
    frame.remove()
  }
}

// Plakat w formacie papierowym (A4…B2) w danej orientacji. Węzeł musi być już
// wyrenderowany statycznie (bez znaczników edycji).
export function printPosterPdf(node: HTMLElement, formatKey: string, orientation: Orientation): Promise<void> {
  const paper = EXPORT_FORMATS[formatKey]?.paper
  if (!paper) throw new Error(`format ${formatKey} nie jest papierowy`)
  return printPages([node], oriented(paper, orientation))
}
