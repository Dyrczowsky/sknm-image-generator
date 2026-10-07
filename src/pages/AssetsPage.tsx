import { useEffect, useState } from 'react'
import { srcOf } from '../assets/registry'
import type { AssetLibrary } from '../assets/useAssetLibrary'
import type { SessionStatus } from '../supabase/useSession'
import { formatTimestamp } from '../utils/formatDate'
import { PageFrame } from '../components/PageFrame'
import { RemotePanel } from '../components/RemotePanel'
import { IMAGE_THUMB, IMAGE_THUMB_IMG } from '../components/styles'
import { Badge } from '../components/ui'

interface AssetsPageProps {
  sessionStatus: SessionStatus
  // Hook wspólnej biblioteki grafik z `App` (ten sam, który trafia do
  // `AssetLibraryContext`): pozycje, przeładowanie, zmiana nazwy, usuwanie,
  // `loadThumbs` do dociągania miniatur.
  library: AssetLibrary
  onSignInClick: () => void
}

const KIND_LABEL = { logo: 'Logotyp', photo: 'Zdjęcie' } as const

// Strona „Grafiki": wspólna biblioteka logotypów i zdjęć zespołu. Na razie
// sama lista z miniaturami - grafiki trafiają tu przy zapisie projektu
// i pobraniu plakatu.
export function AssetsPage({ sessionStatus, library, onSignInClick }: AssetsPageProps) {
  // Wymusza ponowne narysowanie po wczytaniu miniatur do rejestru.
  const [, setHydrated] = useState(0)
  const refs = library.items.map((asset) => asset.ref).join(',')
  const loadThumbs = library.loadThumbs

  useEffect(() => {
    if (!refs) return
    let active = true
    const done = () => {
      if (active) setHydrated((n) => n + 1)
    }
    // Miniatura, której nie udało się pobrać, zostaje pustą ramką.
    void loadThumbs(refs.split(',')).then(done, done)
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `loadThumbs` zmienia się co render
  }, [refs])

  return (
    <PageFrame title="Grafiki" description="Logotypy i zdjęcia użyte w plakatach zespołu. Logotyp z tej biblioteki wstawisz na plakat przyciskiem „Z biblioteki” w edytorze.">
      <RemotePanel
        sessionStatus={sessionStatus}
        listStatus={library.status}
        subject="wspólną bibliotekę grafik"
        onSignInClick={onSignInClick}
        onRetry={library.reload}
        actionError={library.actionError}
      >
        {library.items.length === 0 ? (
          <p className="text-muted">Biblioteka jest pusta. Grafiki pojawią się tu po zapisaniu projektu albo pobraniu plakatu z logotypem lub zdjęciem.</p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
            {library.items.map((asset) => {
              const thumb = srcOf(asset.ref)
              return (
                <li key={asset.ref} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <span className={IMAGE_THUMB}>{thumb && <img className={IMAGE_THUMB_IMG} src={thumb} alt="" />}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong className="truncate font-semibold">{asset.name || 'Bez nazwy'}</strong>
                    <span className="truncate text-[0.8125rem] text-muted">{asset.author_email}</span>
                    <span className="truncate text-[0.8125rem] text-muted">{formatTimestamp(asset.created_at)}</span>
                  </span>
                  <Badge>{KIND_LABEL[asset.kind]}</Badge>
                </li>
              )
            })}
          </ul>
        )}
      </RemotePanel>
    </PageFrame>
  )
}
