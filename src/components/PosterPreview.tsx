import type { ComponentType, RefObject } from 'react'
import type { AccentName, PosterProps, RawPosterData } from '../types'
import { PosterScaled } from './PosterScaled'

const PREVIEW_SIZE = 420

interface PosterPreviewProps {
  posterRef: RefObject<HTMLDivElement | null>
  Component?: ComponentType<PosterProps>
  data: RawPosterData
  scheme?: string
  accent?: AccentName
}

// Podgląd na żywo - aktualizuje się automatycznie przy każdej zmianie
// formularza, szablonu lub schematu kolorów (bez przycisku "Generuj").
export function PosterPreview({ posterRef, Component, data, scheme, accent }: PosterPreviewProps) {
  if (!Component) return null
  return (
    <div className="w-fit overflow-hidden rounded-[10px] border border-border shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <PosterScaled ref={posterRef} size={PREVIEW_SIZE}>
        <Component data={data} scheme={scheme} accent={accent} />
      </PosterScaled>
    </div>
  )
}
