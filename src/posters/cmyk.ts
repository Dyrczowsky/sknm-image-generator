// Konwersja „urządzeniowa" RGB → CMYK, bez profilu ICC: K = 1 − max(R,G,B),
// a C/M/Y to reszta po odjęciu czerni. Nasycone kolory marki (limonka,
// koral) wyjdą w druku nieco bardziej matowo niż na ekranie - to cena braku
// zarządzania kolorem (patrz docs/architektura.md). Alfa jest pomijana:
// plakaty są nieprzezroczyste.
export function rgbaToCmyk(rgba: Uint8ClampedArray | Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(rgba.length)
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    const max = Math.max(r, g, b)
    if (max === 0) {
      out[i + 3] = 255
      continue
    }
    out[i] = Math.round(((max - r) * 255) / max)
    out[i + 1] = Math.round(((max - g) * 255) / max)
    out[i + 2] = Math.round(((max - b) * 255) / max)
    out[i + 3] = 255 - max
  }
  return out
}
