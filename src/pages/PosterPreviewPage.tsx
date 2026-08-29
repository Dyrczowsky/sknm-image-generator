import { posterRegistry } from '../posters/registry'
import { withPlaceholders } from '../posters/fallback'
import { PosterScaled } from '../components/PosterScaled'

// Podgląd pojedynczego szablonu pod /poster/:id, wypełniony danymi
// przykładowymi - przydatne do szybkiego sprawdzenia wyglądu szablonu.
interface PosterPreviewPageProps {
  posterKey: string
  scheme?: string
}

export function PosterPreviewPage({ posterKey, scheme }: PosterPreviewPageProps) {
  const poster = posterRegistry[posterKey]

  const shell = 'mx-auto max-w-[720px] px-4 pt-8 pb-16 min-[900px]:max-w-[1240px]'
  const backLink = 'mb-4 inline-block font-medium text-accent no-underline hover:underline'

  if (!poster) {
    return (
      <main className={shell}>
        <p>Nie znaleziono szablonu „{posterKey}”.</p>
        <a className={backLink} href={import.meta.env.BASE_URL}>Wróć do generatora</a>
      </main>
    )
  }

  const { Component, name } = poster
  const data = withPlaceholders({})

  return (
    <main className={shell}>
      <a className={backLink} href={import.meta.env.BASE_URL}>← Wróć do generatora</a>
      <h1 className="mb-2 text-[1.6rem] font-bold">Podgląd szablonu: {name}{scheme ? ` · ${scheme}` : ''}</h1>
      <div className="overflow-hidden rounded-[10px] border border-border shadow-[0_4px_16px_rgba(0,0,0,0.12)] w-fit">
        <PosterScaled size={600}>
          <Component data={data} scheme={scheme} />
        </PosterScaled>
      </div>
    </main>
  )
}
