import { PosterPreview } from '../components/PosterPreview'
import { PAGE_SHELL } from '../components/styles'
import { SAMPLE_DATA } from '../posters/fallback'
import { posterRegistry } from '../posters/registry'
import { isBannerShape } from '../posters/shape'
import type { PosterShape } from '../types'

const BACK_LINK = 'mb-4 inline-block font-medium text-accent no-underline hover:underline'

// Szerokość podglądu na ekranie zależnie od kształtu.
function previewSize(shape: PosterShape): number {
  if (shape === 'cover') return 1100
  return isBannerShape(shape) ? 800 : 600
}

interface PosterPreviewPageProps {
  posterKey: string
  scheme?: string
  shape?: PosterShape
}

// Podgląd pojedynczego szablonu pod /poster/:klucz[/:schemat], wypełniony
// danymi przykładowymi - przydatne do szybkiego sprawdzenia wyglądu szablonu.
// `?shape=cover|event` pokazuje banerową wersję layoutu.
export function PosterPreviewPage({ posterKey, scheme, shape = 'square' }: PosterPreviewPageProps) {
  const poster = posterRegistry[posterKey]

  if (!poster) {
    return (
      <main className={PAGE_SHELL}>
        <p>Nie znaleziono szablonu „{posterKey}”.</p>
        <a className={BACK_LINK} href={import.meta.env.BASE_URL}>Wróć do generatora</a>
      </main>
    )
  }

  return (
    <main className={PAGE_SHELL}>
      <a className={BACK_LINK} href={import.meta.env.BASE_URL}>← Wróć do generatora</a>
      <h1 className="mb-2 text-[1.6rem] font-bold">Podgląd szablonu: {poster.name}{scheme ? ` · ${scheme}` : ''}</h1>
      <PosterPreview
        Component={isBannerShape(shape) ? poster.Banner : poster.Component}
        data={SAMPLE_DATA}
        scheme={scheme}
        shape={shape}
        size={previewSize(shape)}
      />
    </main>
  )
}
