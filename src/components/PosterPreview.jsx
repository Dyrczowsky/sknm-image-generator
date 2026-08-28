import { PosterScaled } from './PosterScaled'

const PREVIEW_SIZE = 420

// Podgląd na żywo - aktualizuje się automatycznie przy każdej zmianie
// formularza lub szablonu (bez przycisku "Generuj").
export function PosterPreview({ posterRef, Component, data }) {
  if (!Component) return null
  return (
    <div className="poster-preview">
      <PosterScaled ref={posterRef} size={PREVIEW_SIZE}>
        <Component data={data} />
      </PosterScaled>
    </div>
  )
}
