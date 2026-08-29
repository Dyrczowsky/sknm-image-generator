import { PosterScaled } from './PosterScaled'

const PREVIEW_SIZE = 420

// Podgląd na żywo - aktualizuje się automatycznie przy każdej zmianie
// formularza, szablonu lub schematu kolorów (bez przycisku "Generuj").
export function PosterPreview({ posterRef, Component, data, scheme }) {
  if (!Component) return null
  return (
    <div className="poster-preview">
      <PosterScaled ref={posterRef} size={PREVIEW_SIZE}>
        <Component data={data} scheme={scheme} />
      </PosterScaled>
    </div>
  )
}
