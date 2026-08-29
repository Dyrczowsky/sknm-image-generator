import type { ComponentType, RefObject } from 'react'
import type { PosterProps, RawPosterData } from '../types'
import { PosterScaled } from './PosterScaled'

const PREVIEW_SIZE = 420

interface PosterPreviewProps {
  posterRef: RefObject<HTMLDivElement | null>
  Component?: ComponentType<PosterProps>
  data: RawPosterData
  scheme?: string
}

// Podgląd na żywo - aktualizuje się automatycznie przy każdej zmianie
// formularza, szablonu lub schematu kolorów (bez przycisku "Generuj").
export function PosterPreview({ posterRef, Component, data, scheme }: PosterPreviewProps) {
  if (!Component) return null
  return (
    <div className="poster-preview">
      <PosterScaled ref={posterRef} size={PREVIEW_SIZE}>
        <Component data={data} scheme={scheme} />
      </PosterScaled>
    </div>
  )
}
