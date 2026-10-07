// RGBA z canvasu → RGB (3 bajty na piksel) dla obrazu w PDF. Alfa jest
// pomijana: plakaty są nieprzezroczyste. Kolory zostają dokładnie te z ekranu
// (sRGB) - przeliczenie na CMYK robi drukarnia własnym profilem, co daje
// wynik bliższy podglądowi niż konwersja bez profilu ICC po naszej stronie.
export function rgbaToRgb(rgba: Uint8ClampedArray | Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array((rgba.length / 4) * 3)
  for (let i = 0, o = 0; i < rgba.length; i += 4, o += 3) {
    out[o] = rgba[i]
    out[o + 1] = rgba[i + 1]
    out[o + 2] = rgba[i + 2]
  }
  return out
}
