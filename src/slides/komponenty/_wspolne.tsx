import type { CSSProperties, ReactNode } from 'react'
import { Sygnet } from '../../posters/blocks/Sygnet'
import { fontHeading, fontMono } from '../../posters/theme'
import { useSlideRender } from '../defineSlide'
import { SLIDE_SIZE } from '../shape'
import { paletteFor, paletteVars } from '../themes'
import type { PhotoValue } from '../types'
import { EditableText } from './_tekst'

// SZKIC KONTRAKTU - wygląd bloków dopracowuje zadanie 8a. Sygnatury eksportów
// nie mogą się zmienić (używają ich wszystkie komponenty w tym folderze).

export { AutoFit, EditableText, fit } from './_tekst'
export { fontHeading, fontMono }

export interface SlideFrameProps {
  children: ReactNode
  // Wewnętrzny margines treści (domyślnie jak we wzorcu: 90/100 px, kwadrat 80/80/120).
  padding?: CSSProperties['padding']
  // Elementy stałe slajdu - można je wyłączyć w konkretnym układzie.
  sygnet?: boolean
  band?: boolean
  number?: boolean
  style?: CSSProperties
}

// Korzeń slajdu: pełny rozmiar układu, zmienne kolorów, sygnet, pas trójkątów, numer.
export function SlideFrame({ children, padding, sygnet = true, band = true, number = true, style }: SlideFrameProps) {
  const info = useSlideRender()
  const size = SLIDE_SIZE[info.aspect]
  const palette = paletteFor(info.theme, info.background)
  const square = info.aspect === '1:1'
  return (
    <div
      style={{
        ...paletteVars(palette),
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: size.width,
        height: size.height,
        padding: padding ?? (square ? '80px 80px 120px' : '90px 100px'),
        background: 'var(--s-bg)',
        color: 'var(--s-fg)',
        fontFamily: fontHeading,
        ...style,
      }}
    >
      {children}
      {sygnet && <Sygnet name={palette.sygnet} width={88} style={{ position: 'absolute', top: 52, right: 64 }} />}
      {band && <TriangleBand />}
      {number && <SlideNumber />}
    </div>
  )
}

// Pas trójkątów na dole slajdu, losowy, ale stały dla numeru slajdu.
export function TriangleBand() {
  return null
}

// „01 / 11" w lewym dolnym rogu (w kwadracie - w prawym).
export function SlideNumber() {
  return null
}

interface KickerProps {
  path: string
  value: string
  style?: CSSProperties
}

// Plakietka nad nagłówkiem: trójkąt + wersaliki mono.
export function Kicker({ path, value, style }: KickerProps) {
  return <EditableText path={path} value={value} style={{ fontFamily: fontMono, ...style }} />
}

interface ChipProps {
  children: ReactNode
  style?: CSSProperties
}

// Prostokątna plakietka na tle `--s-soft` (miejsce, tag).
export function Chip({ children, style }: ChipProps) {
  return <span style={{ background: 'var(--s-soft)', color: 'var(--s-soft-fg)', ...style }}>{children}</span>
}

export type PhotoVariant = 'cien' | 'ramka' | 'zwykle'

interface PhotoFigureProps {
  photo: PhotoValue
  // `cien` - przesunięty prostokąt w kolorze `--s-band` pod zdjęciem; `ramka` - biała obwódka; `zwykle` - bez ozdób.
  variant?: PhotoVariant
  // Podpis pod zdjęciem (wersaliki, mono), edytowalny na slajdzie.
  caption?: { path: string; value: string }
  // Pozycja i rozmiar w slajdzie (np. `position: 'absolute', left, top, width, height`).
  style?: CSSProperties
  alt?: string
}

// Zdjęcie z kadrem (`object-position`, `zoom`); bez pliku - zakreskowane miejsce na zdjęcie.
export function PhotoFigure({ photo, style, alt = '' }: PhotoFigureProps) {
  return (
    <figure style={{ margin: 0, ...style }}>
      {photo.src && <img src={photo.src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </figure>
  )
}

interface StepProps {
  // Numer kroku (od 1). Element jest widoczny, gdy bieżący krok >= index.
  index: number
  children: ReactNode
  style?: CSSProperties
}

// Element pokazywany po kolei (karta, wpis, tag). Bez „pokazuj po kolei" zawsze widoczny.
export function Step({ children, style }: StepProps) {
  return <div style={style}>{children}</div>
}
