import type { CSSProperties } from 'react'

// Wspólne tokeny wizualne wyciągnięte z projektów plakatów SKNM.
export const colors = {
  navy: '#3C459B',
  navyDark: '#2B3276',
  navyLight: '#4A54B4',
  ink: '#16182F',
  inkPanel: '#1D2040',
  cream: '#F4F2ED',
  creamMuted: '#C9C6BC',
  textMuted: '#3A3A46',
  placeholderBorder: '#B7B3A6',
  placeholderText: '#8A8677',
  placeholderBg: '#DCD8CD',
  placeholderBgAlt: '#EFECE4',
  lime: 'oklch(0.88 0.17 106)',
  limeText: '#232A66',
  coral: 'oklch(0.68 0.17 30)',
  gold: '#84754E',
  // Jaśniejsze złoto na ciemnym tle (Ciekawostka); globalne `gold` zostaje bez zmian.
  goldBright: '#C9A961',
  silver: '#C6C7CB',
  goldPanelText: '#F0EDE4',
  black: '#121212',
  gray: '#8A8D8F',
  grayDark: '#4A4D4F',
  paper: '#E7E4DC',
  slate: '#2A2C2E',
}

export const fontHeading = "Fieldwork, 'Hanken Grotesk', Helvetica, sans-serif"
export const fontMono = "'Space Mono', monospace"

// Światło między literami tytułów (kroju Fieldwork w grubości 800). Przy
// ciaśniejszym ustawieniu (dawniej -.02em do -.045em) sąsiednie litery
// zaczynały się stykać i nachodzić na siebie ("ck", "ko", "wsk").
export const TITLE_TRACKING = '-.008em'

// Wspólna skala typografii dla powtarzających się elementów (blocks/).
// Pojedyncza zmiana tutaj propaguje się do wszystkich szablonów, które
// używają danego bloku.
export const typography = {
  tag: {
    font: `700 22px ${fontMono}`,
    letterSpacing: '.14em',
  },
  branding: {
    font: `700 22px ${fontMono}`,
    letterSpacing: '.16em',
    lineHeight: 1.7,
  },
  bigDay: {
    fontSize: 104,
    fontWeight: 800,
    lineHeight: 0.86,
    letterSpacing: '-.02em',
  },
  bigMonth: {
    fontSize: 44,
    fontWeight: 600,
    letterSpacing: 0,
  },
  bigTime: {
    font: `700 26px ${fontMono}`,
    letterSpacing: '.1em',
  },
  body: {
    fontSize: 30,
    fontWeight: 500,
    lineHeight: 1.4,
  },
}

// O ile mnożnik interlinii rośnie na każde +100% rozmiaru tekstu.
export const LEADING_GROWTH = 0.2

// Najmniejsza interlinia tekstu z suwakiem rozmiaru. W Fieldwork 800 „k”/„ł”
// sięgają 0,697 em nad linię bazową, a „y”/„j”/„g” 0,235 em pod nią - razem
// 0,932 em, więc przy 0,94 ogonek „y” dotykał „k” w wierszu niżej. Przy 1,0
// i 1,12 wiersze tytułu wciąż wyglądały na sklejone (zgłoszenie #43); 1,2
// zostawia ok. 0,27 em odstępu (32 px przy tytule 120 px).
export const MIN_LEADING = 1.2

// Interlinia tekstu powiększonego suwakiem rozmiaru: co najmniej MIN_LEADING,
// a powyżej 100% rośnie szybciej niż sam tekst (130% → +0,06), żeby duże
// litery nie zlewały się w blok.
export function leading(base: number, scale: number): number {
  return Math.round((Math.max(MIN_LEADING, base) + LEADING_GROWTH * Math.max(0, scale - 1)) * 1000) / 1000
}

// Wymiary ramki nadaje PosterFrame z kształtu (patrz shape.ts).
export const posterBaseStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  fontFamily: fontHeading,
}

// Wysokość grafiki logo w stopce (skala plakatu 1080px). Pole ochronne
// wokół grafiki i odstęp między dwiema grafikami = ¼ tej wysokości -
// wgrywane pliki są bez własnego pola ochronnego, bierze je na siebie
// padding wrappera (LogoSlots).
export const LOGO_HEIGHT = 48
export const LOGO_CLEAR = Math.round(LOGO_HEIGHT / 4)

// Logo rośnie do wysokości treści stopki obok, najwyżej do tej wartości
// (patrz PosterFooter); LOGO_HEIGHT to jego minimum.
export const LOGO_MAX_HEIGHT = 72
// Najmniejsza wysokość logo w stopce, która nie może się spiętrzyć (brak
// miejsca w pionie) - zamiast spychać logotypy poza kadr, ściska je do tej wartości.
export const LOGO_SQUEEZE_HEIGHT = 32

// Ile grafik/logotypów mieści się w rzędzie stopki przy LOGO_HEIGHT.
export const MAX_GRAPHICS = 4

// Bok kwadratu kodu QR w stopce (patrz PosterFooter). Po lewej kod ma
// wysokość treści stopki obok (`min`-`max`), przy logotypach - wysokość logo.
// `min` 64 px ≈ 12 mm na A4: poniżej wydrukowany kod skanuje się zawodnie.
export interface QrSizing { min: number; max: number }
export const POSTER_QR: QrSizing = { min: 64, max: 96 }
// Baner (układ 624 px) żyje tylko na ekranie, więc kod może zejść do wysokości logo.
export const BANNER_QR: QrSizing = { min: LOGO_HEIGHT, max: 72 }
