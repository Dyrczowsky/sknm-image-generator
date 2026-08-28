// Schematy kolorów są ZAGNIEŻDŻONE per layout, bo „granat" Wykładu (biały na
// granacie) to nie to samo co „granat" Warsztatu (granat na kremie). Każdy
// layout ma pełny blok `default` + nazwane schematy nadpisujące tylko różnice.
// Bloki layoutów dokłada się w kolejnych taskach (Task 4–11).
export const schemes = {}

// camelCase → --kebab; layout może dodać dowolną rolę bez zmiany resolvera.
const roleToVar = (k) => '--' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
const NON_CSS = new Set(['sygnet', 'logoVariant'])

// Scala nazwany schemat nad `default` danego layoutu. Nieznany layout / schemat
// → pusty wynik / sam `default`.
export function resolveScheme(layoutKey, name) {
  const layout = schemes[layoutKey] ?? {}
  const merged = { ...(layout.default ?? {}), ...(layout[name] ?? {}) }
  const cssVars = {}
  for (const [k, v] of Object.entries(merged)) {
    if (!NON_CSS.has(k)) cssVars[roleToVar(k)] = v
  }
  return { cssVars, sygnet: merged.sygnet, logoVariant: merged.logoVariant }
}

// Podpisy swatchy kolorystyki w UI. `default` bywa „Granat" albo (Rekrutacja)
// pierwszym elementem jest `limonka`.
export const SCHEME_LABELS = {
  default: 'Granat',
  limonka: 'Limonka',
  czern: 'Czerń',
  zloto: 'Złoto',
  jasny: 'Jasny',
  szary: 'Szary',
}
