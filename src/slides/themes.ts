import type { CSSProperties } from 'react'
import { colors } from '../posters/theme'
import type { SygnetName } from '../types'
import type { SlideBackground, SlideThemeKey } from './types'

// Role kolorów slajdu. Komponenty używają WYŁĄCZNIE `var(--s-...)`, nigdy hexów,
// więc zmiana motywu albo tła slajdu nie wymaga zmian w komponentach.
export interface SlidePalette {
  bg: string // tło slajdu
  fg: string // główny tekst
  muted: string // podpisy, numer slajdu, opisy kart
  accent: string // nagłówki, plakietka (kicker), obramowania, wypełnienie przycisku-linku
  onAccent: string // tekst na wypełnieniu `accent`
  soft: string // tło kart, tagów, plakietki miejsca
  softFg: string // tekst na `soft`
  band: string // trójkąty w pasie na dole i cień zdjęcia
  frame: string // ramka drugiego zdjęcia
  sygnet: SygnetName
}

export interface SlideTheme {
  label: string
  jasne: SlidePalette
  ciemne: SlidePalette
}

const WHITE = '#ffffff'

export const SLIDE_THEMES: Record<SlideThemeKey, SlideTheme> = {
  granat: {
    label: 'Granat',
    jasne: {
      bg: WHITE,
      fg: colors.ink,
      muted: '#565B80',
      accent: colors.navy,
      onAccent: WHITE,
      soft: '#EEF0FA',
      softFg: colors.navy,
      band: colors.navy,
      frame: WHITE,
      sygnet: 'granat',
    },
    ciemne: {
      bg: colors.navy,
      fg: WHITE,
      muted: 'rgba(255,255,255,.72)',
      accent: WHITE,
      onAccent: colors.navy,
      soft: 'rgba(255,255,255,.15)',
      softFg: WHITE,
      band: WHITE,
      frame: WHITE,
      sygnet: 'negatywny',
    },
  },
  kremowy: {
    label: 'Kremowy',
    jasne: {
      bg: colors.cream,
      fg: colors.ink,
      muted: colors.textMuted,
      accent: colors.navy,
      onAccent: WHITE,
      soft: colors.paper,
      softFg: colors.navy,
      band: colors.navy,
      frame: WHITE,
      sygnet: 'granat',
    },
    ciemne: {
      bg: colors.navyDark,
      fg: colors.cream,
      muted: colors.creamMuted,
      accent: colors.cream,
      onAccent: colors.navyDark,
      soft: 'rgba(244,242,237,.14)',
      softFg: colors.cream,
      band: colors.cream,
      frame: colors.cream,
      sygnet: 'negatywny',
    },
  },
  ciemny: {
    label: 'Ciemny',
    jasne: {
      bg: colors.ink,
      fg: colors.cream,
      muted: colors.creamMuted,
      accent: colors.lime,
      onAccent: colors.limeText,
      soft: colors.inkPanel,
      softFg: colors.lime,
      band: colors.lime,
      frame: colors.cream,
      sygnet: 'negatywny',
    },
    ciemne: {
      bg: colors.lime,
      fg: colors.limeText,
      muted: 'rgba(35,42,102,.75)',
      accent: colors.limeText,
      onAccent: colors.lime,
      soft: 'rgba(35,42,102,.12)',
      softFg: colors.limeText,
      band: colors.limeText,
      frame: WHITE,
      sygnet: 'granat',
    },
  },
}

export const THEME_KEYS = Object.keys(SLIDE_THEMES) as SlideThemeKey[]

export function paletteFor(theme: SlideThemeKey, background: SlideBackground): SlidePalette {
  return (SLIDE_THEMES[theme] ?? SLIDE_THEMES.granat)[background]
}

// Zmienne CSS rozlewane na korzeń slajdu (`--s-bg`, `--s-fg`, ...).
export function paletteVars(palette: SlidePalette): CSSProperties {
  return {
    '--s-bg': palette.bg,
    '--s-fg': palette.fg,
    '--s-muted': palette.muted,
    '--s-accent': palette.accent,
    '--rich-accent': 'var(--s-accent)', // akcent runów RichText na slajdzie
    '--s-on-accent': palette.onAccent,
    '--s-soft': palette.soft,
    '--s-soft-fg': palette.softFg,
    '--s-band': palette.band,
    '--s-frame': palette.frame,
  } as CSSProperties
}
