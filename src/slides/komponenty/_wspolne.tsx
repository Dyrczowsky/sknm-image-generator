import type { CSSProperties, ReactNode } from 'react'
import { Sygnet } from '../../posters/blocks/Sygnet'
import { colors, fontHeading, fontMono } from '../../posters/theme'
import { useSlideEdit, useSlideRender } from '../defineSlide'
import { SLIDE_SIZE } from '../shape'
import { paletteFor, paletteVars } from '../themes'
import type { PhotoValue } from '../types'
import { EditableText } from './_tekst'

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
      <div style={{ position: 'relative', height: '100%' }}>{children}</div>
      {sygnet && <Sygnet name={palette.sygnet} width={88} style={{ position: 'absolute', top: 52, right: 64 }} />}
      {band && <TriangleBand />}
      {number && <SlideNumber />}
    </div>
  )
}

const BAND_TRIANGLE_W = 36
const BAND_H = 32

// Trójkąty pasa: deterministyczne dla numeru slajdu `k` i szerokości `width`.
export function bandTriangles(width: number, k: number): { points: string; opacity: string }[] {
  const w = BAND_TRIANGLE_W
  const h = BAND_H
  const n = Math.ceil(width / (w / 2)) + 1
  const result: { points: string; opacity: string }[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.abs(Math.sin((i + 1) * 12.9898 + (k + 1) * 78.233) * 43758.5453) % 1
    if (r < 0.3) continue
    const x = (i * w) / 2 - w / 2
    const points = i % 2 === 0 ? `${x},${h} ${x + w},${h} ${x + w / 2},0` : `${x},0 ${x + w},0 ${x + w / 2},${h}`
    result.push({ points, opacity: (0.12 + r * 0.75).toFixed(2) })
  }
  return result
}

// Pas trójkątów na dole slajdu, losowy, ale stały dla numeru slajdu.
export function TriangleBand() {
  const info = useSlideRender()
  const width = SLIDE_SIZE[info.aspect].width
  return (
    <svg
      viewBox={`0 0 ${width} ${BAND_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: BAND_H, display: 'block', color: 'var(--s-band)' }}
    >
      {bandTriangles(width, info.index).map((t) => (
        <polygon key={t.points} points={t.points} fill="currentColor" opacity={t.opacity} />
      ))}
    </svg>
  )
}

// „01 / 11" w lewym dolnym rogu (w kwadracie - w prawym).
export function SlideNumber() {
  const info = useSlideRender()
  const square = info.aspect === '1:1'
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 46,
        ...(square ? { right: 80 } : { left: 100 }),
        fontFamily: fontMono,
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: '.14em',
        color: 'var(--s-muted)',
      }}
    >
      {`${pad(info.index + 1)} / ${pad(info.total)}`}
    </div>
  )
}

interface KickerProps {
  path: string
  value: string
  style?: CSSProperties
}

// Plakietka nad nagłówkiem: trójkąt + wersaliki mono.
export function Kicker({ path, value, style }: KickerProps) {
  const { editable } = useSlideEdit()
  if (!value && !editable) return null
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 26, ...style }}>
      <span
        aria-hidden="true"
        style={{ width: 22, height: 19, flexShrink: 0, background: 'var(--s-accent)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
      />
      <EditableText
        path={path}
        value={value}
        as="span"
        style={{
          fontFamily: fontMono,
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: 'var(--s-accent)',
        }}
      />
    </div>
  )
}

interface ChipProps {
  children: ReactNode
  style?: CSSProperties
}

// Prostokątna plakietka na tle `--s-soft` (miejsce, tag).
export function Chip({ children, style }: ChipProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '9px 18px',
        background: 'var(--s-soft)',
        color: 'var(--s-soft-fg)',
        fontSize: 21,
        fontWeight: 800,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </span>
  )
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
export function PhotoFigure({ photo, variant = 'zwykle', caption, style, alt = '' }: PhotoFigureProps) {
  const origin = `${photo.x}% ${photo.y}%`
  return (
    <figure style={{ position: 'relative', margin: 0, ...style }}>
      {variant === 'cien' && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--s-band)', transform: 'translate(16px, 16px)' }} />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          outline: variant === 'ramka' ? '10px solid var(--s-frame)' : undefined,
        }}
      >
        {photo.src ? (
          <img
            src={photo.src}
            alt={alt}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: origin,
              transform: `scale(${photo.zoom})`,
              transformOrigin: origin,
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `repeating-linear-gradient(135deg, ${colors.placeholderBg} 0 10px, ${colors.placeholderBgAlt} 10px 20px)`,
              color: colors.placeholderText,
              fontFamily: fontMono,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '.16em',
            }}
          >
            ZDJĘCIE
          </div>
        )}
      </div>
      {caption && (
        <EditableText
          path={caption.path}
          value={caption.value}
          as="figcaption"
          style={{
            position: 'absolute',
            left: 0,
            bottom: -44,
            fontFamily: fontMono,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--s-muted)',
            whiteSpace: 'nowrap',
          }}
        />
      )}
    </figure>
  )
}

interface StepProps {
  // Numer kroku (od 1). Element jest widoczny, gdy bieżący krok >= index.
  index: number
  children: ReactNode
  style?: CSSProperties
}

const STEP_EASE = 'cubic-bezier(.2,.8,.2,1)'

// Element pokazywany po kolei (karta, wpis, tag). Bez „pokazuj po kolei" zawsze widoczny.
export function Step({ index, children, style }: StepProps) {
  const info = useSlideRender()
  const hidden = info.reveal && info.step < index
  return (
    <div
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? 'translateY(24px)' : 'none',
        transition: `opacity .45s ${STEP_EASE}, transform .45s ${STEP_EASE}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
