import type { ComponentType, RefObject } from 'react'
import type { AccentName, PosterLang, PosterProps, PosterShape, RawPosterData } from '../types'
import { PosterScaled } from './PosterScaled'

interface PosterPreviewProps {
  // Ref do węzła plakatu w pełnej rozdzielczości (źródło eksportu).
  posterRef?: RefObject<HTMLDivElement | null>
  Component?: ComponentType<PosterProps>
  data: RawPosterData
  scheme?: string
  accent?: AccentName
  lang?: PosterLang
  shape?: PosterShape
  // Szerokość podglądu na ekranie (px); wysokość wynika z kształtu.
  size: number
}

// Podgląd na żywo - aktualizuje się automatycznie przy każdej zmianie
// formularza, szablonu lub schematu kolorów (bez przycisku "Generuj").
// Rozmiar podaje rodzic (`PreviewPane` dopasowuje go do panelu).
export function PosterPreview({ posterRef, Component, data, scheme, accent, lang, shape, size }: PosterPreviewProps) {
  if (!Component) return null
  return (
    <div className="w-fit flex-none overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_6px_24px_-6px_rgb(0_0_0/0.35)]">
      <PosterScaled ref={posterRef} size={size} shape={shape}>
        <Component data={data} scheme={scheme} accent={accent} lang={lang} />
      </PosterScaled>
    </div>
  )
}
