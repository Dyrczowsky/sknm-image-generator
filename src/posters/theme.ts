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

// Ile grafik/logotypów mieści się w rzędzie stopki przy LOGO_HEIGHT.
export const MAX_GRAPHICS = 4

// Bok kwadratu kodu QR w stopce plakatu (banery mają mniejszy, patrz
// banners/common.tsx).
export const QR_SIZE = 96
