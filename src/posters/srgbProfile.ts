// Profil ICC sRGB (v2, macierz + krzywa) budowany w kodzie, żeby nie dokładać
// pliku binarnego. Osadzony w PDF mówi przeglądarce plików i drukarni wprost,
// że piksele są w sRGB - bez niego `/DeviceRGB` każdy interpretuje po swojemu.

const HEADER_SIZE = 128
const TAG_ENTRY_SIZE = 12
// Liczba próbek krzywej tonalnej; 1024 oddaje krzywą sRGB z zapasem dla 8 bitów.
const CURVE_POINTS = 1024

// Biel D50 (przestrzeń PCS) i barwy podstawowe sRGB zaadaptowane do D50.
const D50 = [0.9642, 1, 0.8249]
const RED = [0.43607, 0.22249, 0.01392]
const GREEN = [0.38515, 0.71687, 0.09708]
const BLUE = [0.14307, 0.06061, 0.7141]

const ascii = (text: string): number[] => Array.from(text, (ch) => ch.charCodeAt(0))
const u16 = (n: number): number[] => [(n >> 8) & 0xff, n & 0xff]
const u32 = (n: number): number[] => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
// Liczba stałoprzecinkowa s15Fixed16.
const fixed = (value: number): number[] => u32(Math.round(value * 65536))

const xyzTag = (xyz: number[]): number[] => [...ascii('XYZ '), ...u32(0), ...xyz.flatMap(fixed)]

// Opis profilu w formacie v2: tekst ASCII, potem puste warianty Unicode i ScriptCode.
function descTag(text: string): number[] {
  return [...ascii('desc'), ...u32(0), ...u32(text.length + 1), ...ascii(text), 0, ...u32(0), ...u32(0), ...u16(0), 0, ...new Array<number>(67).fill(0)]
}

const textTag = (text: string): number[] => [...ascii('text'), ...u32(0), ...ascii(text), 0]

// Krzywa sRGB (kodowanie → światło liniowe) jako tabela 16-bitowa.
function curveTag(): number[] {
  const out = [...ascii('curv'), ...u32(0), ...u32(CURVE_POINTS)]
  for (let i = 0; i < CURVE_POINTS; i++) {
    const c = i / (CURVE_POINTS - 1)
    const linear = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    out.push(...u16(Math.round(linear * 65535)))
  }
  return out
}

export function buildSrgbProfile(): Uint8Array<ArrayBuffer> {
  const curve = curveTag()
  // Trzy kanały dzielą jedną krzywą - wpisy rTRC/gTRC/bTRC wskazują te same dane.
  const tags: Array<[string, number[]]> = [
    ['desc', descTag('sRGB IEC61966-2.1')],
    ['cprt', textTag('Public Domain')],
    ['wtpt', xyzTag(D50)],
    ['rXYZ', xyzTag(RED)],
    ['gXYZ', xyzTag(GREEN)],
    ['bXYZ', xyzTag(BLUE)],
    ['rTRC', curve],
    ['gTRC', curve],
    ['bTRC', curve],
  ]

  const table: number[] = u32(tags.length)
  const data: number[] = []
  const placed = new Map<number[], number>()
  const dataStart = HEADER_SIZE + 4 + tags.length * TAG_ENTRY_SIZE
  for (const [signature, bytes] of tags) {
    let offset = placed.get(bytes)
    if (offset === undefined) {
      offset = dataStart + data.length
      placed.set(bytes, offset)
      data.push(...bytes)
      // Dane każdego tagu zaczynają się na granicy 4 bajtów.
      while (data.length % 4) data.push(0)
    }
    table.push(...ascii(signature), ...u32(offset), ...u32(bytes.length))
  }

  const size = dataStart + data.length
  const header = [
    ...u32(size),
    ...u32(0), // preferowany CMM: brak
    ...u32(0x02100000), // wersja 2.1
    ...ascii('mntr'),
    ...ascii('RGB '),
    ...ascii('XYZ '),
    ...u16(2026), ...u16(1), ...u16(1), ...u16(0), ...u16(0), ...u16(0),
    ...ascii('acsp'),
    ...u32(0), // platforma
    ...u32(0), // flagi
    ...u32(0), // producent urządzenia
    ...u32(0), // model urządzenia
    ...u32(0), ...u32(0), // atrybuty urządzenia
    ...u32(0), // intencja: percepcyjna
    ...D50.flatMap(fixed),
    ...u32(0), // twórca profilu
  ]
  while (header.length < HEADER_SIZE) header.push(0)

  return new Uint8Array([...header, ...table, ...data])
}
