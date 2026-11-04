// Wysokość logotypów w stopce: tyle, ile chce treść stopki (`wanted`), ale
// nie więcej, niż mieści się w jednym rzędzie - wtedy kolejne logo sponsora
// nie spada do nowej linii. Nigdy poniżej `min` (LOGO_HEIGHT); gdy grafik
// jest tyle, że nie mieszczą się nawet w `min`, rząd zawija się jak dawniej.
//
// Szerokość rzędu przy wysokości h (FooterLogos): każdy element (logo i kod QR
// przy logotypach) to h × proporcja + padding 2·clear, między elementami odstęp
// clear, a cały rząd jest wysunięty o clear w prawo:
//   h·(Σratio + qr) + 2c·k + c·(k-1) ≤ avail + c
export interface LogoFitInput {
  wanted: number
  min: number
  // Szerokość miejsca na logotypy (px układu).
  avail: number
  // Proporcje szerokość/wysokość grafik; `undefined` = grafika jeszcze się nie wczytała.
  ratios: (number | undefined)[]
  // Kod QR stoi w rzędzie logotypów (kwadrat o boku h).
  qrInRow: boolean
  clear: number
}

// Szerokość rzędu logotypów (FooterLogos) przy wysokości `h`; `null` - nie
// wszystkie grafiki się wczytały.
export function logoRowWidth(h: number, ratios: (number | undefined)[], qrInRow: boolean, clear: number): number | null {
  if (ratios.some((r) => !(r !== undefined && r > 0))) return null
  const k = ratios.length + (qrInRow ? 1 : 0)
  const units = (ratios as number[]).reduce((sum, r) => sum + r, 0) + (qrInRow ? 1 : 0)
  return h * units + 2 * clear * k + clear * (k - 1) - clear
}

export function fitLogoHeight({ wanted, min, avail, ratios, qrInRow, clear }: LogoFitInput): number {
  if (wanted < min || !(avail > 0) || ratios.length === 0) return Math.max(min, wanted)
  // Bez wszystkich proporcji nie da się policzyć - zostaje `wanted`, a po
  // wczytaniu grafik wysokość się poprawia.
  if (ratios.some((r) => !(r !== undefined && r > 0))) return wanted
  const k = ratios.length + (qrInRow ? 1 : 0)
  const units = (ratios as number[]).reduce((sum, r) => sum + r, 0) + (qrInRow ? 1 : 0)
  const fit = Math.floor((avail + clear - 2 * clear * k - clear * (k - 1)) / units)
  return Math.max(min, Math.min(wanted, fit))
}
