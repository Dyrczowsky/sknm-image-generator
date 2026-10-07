import { posterRegistry } from '../posters/registry'
import { withPlaceholders } from '../posters/fallback'
import { PosterScaled } from '../components/PosterScaled'
import { isBannerShape } from '../posters/shape'
import type { PosterShape } from '../types'

// Podgląd pojedynczego szablonu pod /poster/:id, wypełniony danymi
// przykładowymi - przydatne do szybkiego sprawdzenia wyglądu szablonu.
interface PosterPreviewPageProps {
  posterKey: string
  scheme?: string
  shape?: PosterShape
}

export function PosterPreviewPage({ posterKey, scheme, shape = 'square' }: PosterPreviewPageProps) {
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

  // `?shape=cover|event` pokazuje banerową wersję layoutu.
  const banner = isBannerShape(shape)
  const Component = banner ? poster.Banner : poster.Component
  const { name } = poster
  const data = withPlaceholders({})

  return (
    <main className={shell}>
      <a className={backLink} href={import.meta.env.BASE_URL}>← Wróć do generatora</a>
      <h1 className="mb-2 text-[1.6rem] font-bold">Podgląd szablonu: {name}{scheme ? ` · ${scheme}` : ''}</h1>
      <div className="overflow-hidden rounded-[10px] border border-border shadow-[0_4px_16px_rgba(0,0,0,0.12)] w-fit">
        <PosterScaled size={shape === 'cover' ? 1100 : banner ? 800 : 600} shape={shape}>
          <Component data={data} scheme={scheme} />
        </PosterScaled>
      </div>
    </main>
  )
}
