import { posterRegistry } from '../posters/registry'
import { withPlaceholders } from '../posters/fallback'
import { PosterScaled } from '../components/PosterScaled'

// Podgląd pojedynczego szablonu pod /poster/:id, wypełniony danymi
// przykładowymi - przydatne do szybkiego sprawdzenia wyglądu szablonu.
export function PosterPreviewPage({ posterKey }) {
  const poster = posterRegistry[posterKey]

  if (!poster) {
    return (
      <main className="app-shell">
        <p>Nie znaleziono szablonu „{posterKey}”.</p>
        <a href={import.meta.env.BASE_URL}>Wróć do generatora</a>
      </main>
    )
  }

  const { Component, name } = poster
  const data = withPlaceholders({})

  return (
    <main className="app-shell">
      <a href={import.meta.env.BASE_URL}>← Wróć do generatora</a>
      <h1>Podgląd szablonu: {name}</h1>
      <div className="poster-preview">
        <PosterScaled size={600}>
          <Component data={data} />
        </PosterScaled>
      </div>
    </main>
  )
}
