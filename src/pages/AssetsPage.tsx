import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ensureUploaded, importImage } from '../assets/assets'
import { importErrorMessage } from '../assets/prepare'
import { refOf, srcOf } from '../assets/registry'
import type { AssetLibrary } from '../assets/useAssetLibrary'
import type { SessionStatus } from '../supabase/useSession'
import { IMAGE_ACCEPT } from '../utils/readAsDataUrl'
import { AssetTile } from '../components/AssetTile'
import { CARD_GRID } from '../components/cardStyles'
import { EmptyNote } from '../components/cards'
import { PageFrame } from '../components/PageFrame'
import { RemotePanel } from '../components/RemotePanel'
import { SegmentedToggle } from '../components/SegmentedToggle'
import { Icon, buttonClass } from '../components/ui'

interface AssetsPageProps {
  sessionStatus: SessionStatus
  // Hook wspólnej biblioteki grafik z `App` (ten sam, który trafia do
  // `AssetLibraryContext`): pozycje, przeładowanie, zmiana nazwy, usuwanie,
  // rejestracja i `loadThumbs` do dociągania miniatur.
  library: AssetLibrary
  onSignInClick: () => void
  // E-mail zalogowanej osoby - po nim poznajemy jej własne wgrania. Gdy `App`
  // go nie poda, strona pyta o sesję klienta Supabase.
  memberEmail?: string
}

type Filter = 'all' | 'logo' | 'photo'

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// E-mail zalogowanej osoby: z propsa albo z sesji klienta.
function useMemberEmail(fromProps: string | undefined, signedIn: boolean): string {
  const [fromSession, setFromSession] = useState('')
  useEffect(() => {
    if (fromProps !== undefined || !signedIn) return
    let active = true
    // Dynamicznie, bo moduł klienta czyta `window` już przy imporcie (testy w node).
    void import('../supabase/client').then(async ({ supabase }) => {
      const email = (await supabase?.auth.getSession())?.data.session?.user.email
      if (active) setFromSession(email ?? '')
    })
    return () => {
      active = false
    }
  }, [fromProps, signedIn])
  return fromProps ?? fromSession
}

// Strona „Grafiki": wspólna biblioteka logotypów i zdjęć zespołu. Grafiki
// trafiają tu przy zapisie projektu i pobraniu plakatu albo przyciskiem
// „Dodaj logotyp" - bez robienia plakatu.
export function AssetsPage({ sessionStatus, library, onSignInClick, memberEmail }: AssetsPageProps) {
  const signedIn = sessionStatus === 'signedIn'
  const me = useMemberEmail(memberEmail, signedIn)
  const [filter, setFilter] = useState<Filter>('all')
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  // Wymusza ponowne narysowanie po wczytaniu miniatur do rejestru.
  const [, setHydrated] = useState(0)

  const logos = library.items.filter((asset) => asset.kind === 'logo').length
  const photos = library.items.length - logos
  const shown = filter === 'all' ? library.items : library.items.filter((asset) => asset.kind === filter)

  // Miniatury tylko dla widocznego filtra i tylko te, których jeszcze nie ma
  // w rejestrze; lista może dojść po zamontowaniu strony, więc efekt śledzi refy.
  const refs = shown.map((asset) => asset.ref).filter((ref) => srcOf(ref) === undefined).join(',')
  const loadThumbs = library.loadThumbs

  useEffect(() => {
    if (!refs) return
    let active = true
    const done = () => {
      if (active) setHydrated((n) => n + 1)
    }
    // Miniatura, której nie udało się pobrać, zostaje neutralną ramką.
    void loadThumbs(refs.split(',')).then(done, done)
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `loadThumbs` zmienia się co render
  }, [refs])

  // Logotypy trafiają do biblioteki bez plakatu: import jak w polu logotypów,
  // wgranie do Storage i wpis do katalogu.
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    setUploading(true)
    setErrors([])
    const problems: string[] = []
    for (const file of files) {
      let ref: string | undefined
      try {
        ref = refOf(await importImage(file, 'logo'))
      } catch (error) {
        problems.push(importErrorMessage(error, file.name))
        continue
      }
      try {
        if (!ref) throw new Error('brak nazwy grafiki')
        const { requireSupabase } = await import('../supabase/client')
        let registered = false
        await ensureUploaded([ref], requireSupabase(), async (asset) => {
          await library.register(asset)
          registered = true
        })
        // Grafika wgrana wcześniej z tej przeglądarki, a potem usunięta z biblioteki.
        if (!registered) await library.register({ ref, kind: 'logo', name: file.name })
      } catch {
        problems.push(`Nie udało się dodać „${file.name}" do biblioteki. Sprawdź połączenie i spróbuj ponownie.`)
      }
    }
    setErrors(problems)
    setUploading(false)
  }

  const actions = signedIn && (
    <label
      className={`${buttonClass({ variant: 'primary', size: 'md' })} relative has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${uploading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <Icon name={uploading ? 'spinner' : 'upload'} className={uploading ? 'animate-spin' : undefined} />
      {uploading ? 'Dodawanie…' : 'Dodaj logotyp'}
      <input
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        disabled={uploading}
        aria-label="Dodaj logotyp do biblioteki"
        onChange={(e) => void upload(e)}
      />
    </label>
  )

  return (
    <PageFrame
      title="Grafiki"
      description="Logotypy i zdjęcia użyte w plakatach zespołu. Logotyp z tej biblioteki wstawisz na plakat przyciskiem „Z biblioteki” w edytorze."
      actions={actions}
    >
      <RemotePanel
        sessionStatus={sessionStatus}
        listStatus={library.status}
        subject="wspólną bibliotekę grafik"
        onSignInClick={onSignInClick}
        onRetry={library.reload}
        actionError={library.actionError}
      >
        <div className="flex flex-col gap-4">
          {errors.length > 0 && (
            <div role="alert" className="flex flex-col gap-1 rounded-lg bg-danger-soft px-3 py-2 text-[0.8125rem] text-danger">
              {errors.map((message) => (
                <p key={message} className="m-0 flex items-start gap-2">
                  <Icon name="alert" className="mt-px" />
                  {message}
                </p>
              ))}
            </div>
          )}
          {library.items.length === 0 ? (
            <EmptyNote>Biblioteka jest pusta. Dodaj logotyp przyciskiem u góry albo zapisz projekt czy pobierz plakat z logotypem lub zdjęciem.</EmptyNote>
          ) : (
            <>
              <SegmentedToggle
                ariaLabel="Rodzaj grafiki"
                value={filter}
                onChange={setFilter}
                className="self-start"
                options={[
                  { value: 'all', label: `Wszystkie (${library.items.length})` },
                  { value: 'logo', label: `Logotypy (${logos})` },
                  { value: 'photo', label: `Zdjęcia (${photos})` },
                ]}
              />
              {shown.length === 0 ? (
                <EmptyNote>{filter === 'logo' ? 'Nie ma jeszcze żadnego logotypu.' : 'Nie ma jeszcze żadnego zdjęcia.'}</EmptyNote>
              ) : (
                <ul className={CARD_GRID}>
                  {shown.map((asset) => (
                    <AssetTile
                      key={asset.ref}
                      asset={asset}
                      thumb={srcOf(asset.ref)}
                      own={me !== '' && same(asset.author_email, me)}
                      onRename={(ref, name) => void library.rename(ref, name)}
                      onRemove={(ref) => void library.remove(ref)}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </RemotePanel>
    </PageFrame>
  )
}
