import type { CSSProperties, ReactElement, ReactNode } from 'react'
import type { CiekawostkaLayout, PosterProps, SygnetName } from '../types'
import { DEFAULT_BADGE, SITE_URL } from './copy'
import { PLACEHOLDERS, withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { fontMono, leading, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { PosterAutoFit } from './blocks/PosterAutoFit'
import { posterFit } from './blocks/posterFit'
import { PosterFooter } from './blocks/PosterFooter'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterText } from './blocks/PosterText'
import { Sygnet } from './blocks/Sygnet'
import { PhotoGallery } from './PhotoGallery'

// Ostrzeżenie w edytorze, gdy opis nie mieści się nawet po zmniejszeniu.
const BODY_NOTICE = 'Opis nie mieści się — skróć tekst albo zmniejsz rozmiar tekstu.'

// Story 1080×1920: górne 250 px i dolne 340 px zasłania interfejs Instagrama -
// tam tylko zdjęcie i tło, bez tekstu, sygnetu, logo i kodu QR.
const STORY_SAFE_TOP = 250
const STORY_SAFE_BOTTOM = 340

// Wspólne, gotowe elementy plakatu - każdy układ tylko je rozstawia (i podaje
// rozmiary zależne od kształtu), zamiast powielać pola.
interface CiekawostkaParts {
  story: boolean
  width: number
  height: number
  sygnet: SygnetName | undefined
  // Etykieta z trójkątem („CZY WIESZ, ŻE…”).
  kicker: ReactNode
  // Pytanie-tytuł w rozmiarze bazowym `size` (mnożonym przez suwak tytułu).
  title: (size: number) => ReactNode
  // Opis w pudełku, które samo zmniejsza font (od `size` × suwak do `min` ×).
  body: (size: number, min: number) => ReactNode
  footer: ReactNode
  // Zdjęcie (galeria) w podanym kadrze; `children` nakładają się na zdjęcie.
  photo: (style: CSSProperties, label: ReactNode, children?: ReactNode) => ReactNode
}

// CIEKAWOSTKA — „Czy wiesz, że…?”: zdjęcie, pytanie i akapit historii.
export function PosterCiekawostka({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, logoSlots, qrUrl, qrSide, qrPlacement, photos, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('ciekawostka', scheme, accent)
  const { shape, width, height } = usePosterShape()

  const parts: CiekawostkaParts = {
    story: shape === 'story',
    width,
    height,
    sygnet,
    kicker: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...fx('badge') }}>
        <div style={{ width: 22, height: 19, flex: '0 0 auto', background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        <Badge color="var(--accent)" field={{ path: 'badge', value: raw.badge, fallback: DEFAULT_BADGE.ciekawostka[lang], label: 'Etykieta' }} />
      </div>
    ),
    title: (size) => (
      <PosterText
        path="title"
        value={raw.title}
        fallback={PLACEHOLDERS.ciekawostkaTitle}
        multiline
        label="Tytuł"
        style={{ fontSize: size * titleScale, fontWeight: 800, lineHeight: leading(1, titleScale), letterSpacing: TITLE_TRACKING, fontKerning: 'none', whiteSpace: 'pre-line', ...fx('title') }}
      />
    ),
    body: (size, min) => (
      <PosterAutoFit min={min} notice={BODY_NOTICE} style={{ flex: 1, minHeight: 0 }}>
        <PosterText
          path="body"
          value={raw.body}
          fallback={PLACEHOLDERS.ciekawostkaBody}
          multiline
          label="Opis"
          style={{ fontSize: posterFit(size * textScale), fontWeight: 500, lineHeight: leading(1.45, textScale), color: 'var(--muted-text)', whiteSpace: 'pre-wrap', ...fx('body') }}
        />
      </PosterAutoFit>
    ),
    footer: (
      <PosterFooter
        qrUrl={qrUrl} qrSide={qrSide} qrPlacement={qrPlacement} slots={logoSlots} variant={logoVariant}
        lead={
          <PosterText
            path="badge2"
            value={raw.badge2}
            fallback={SITE_URL}
            label="Linia na dole"
            style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', color: 'var(--accent)', ...fx('badge2') }}
          />
        }
      />
    ),
    photo: (style, label, children) => (
      <PhotoGallery photos={photos.photo} label={label} style={{ flex: '0 0 auto', ...style }}>
        {children}
      </PhotoGallery>
    ),
  }

  const Layout = LAYOUTS[data.ciekawostkaLayout ?? 'zdjecie'] ?? LayoutZdjecie
  return (
    <PosterFrame vars={cssVars} style={{ justifyContent: 'flex-start' }}>
      <Layout {...parts} />
    </PosterFrame>
  )
}

// A — „Zdjęcie u góry”: zdjęcie od krawędzi do krawędzi (ok. połowy kadru),
// złota linia, etykieta, pytanie, opis i stopka. Druk (pion/poziom) to ten sam
// układ ze zdjęciem proporcjonalnym do wysokości ramki.
function LayoutZdjecie({ story, width, height, sygnet, kicker, title, body, footer, photo }: CiekawostkaParts) {
  const photoH = story ? 900 : Math.round((height * 540) / 1080)
  // Trójkąt w kolorze tła strony (metal: `--sygnet-bg`, też ciemne tło) -
  // sygnet ze schematu jest dobrany do tła strony, a na trójkącie w kolorze
  // akcentu ginąłby (granat na granacie w schemacie kremowym). W Story sygnet
  // schodzi poniżej strefy zasłanianej przez Instagram, więc trójkąt jest
  // większy, żeby sygnet dalej w nim siedział.
  const tri = story ? 520 : 420
  const sygnetTop = story ? STORY_SAFE_TOP + 22 : 72

  return (
    <>
      {photo(
        { height: photoH },
        <>stare zdjęcie grupowe<br />{`${width} × ${photoH}`}</>,
        <div style={{ position: 'absolute', top: 0, left: 0, width: tri, height: tri, background: 'var(--sygnet-bg, var(--page-bg))', clipPath: 'polygon(0 0,100% 0,0 100%)', padding: `${sygnetTop}px 0 0 72px`, boxSizing: 'border-box' }}>
          <Sygnet name={sygnet} />
        </div>,
      )}
      <div style={{ height: 2, flex: '0 0 auto', background: 'linear-gradient(to right, transparent, var(--accent) 15%, var(--accent) 85%, transparent)' }} />
      <div
        style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
          padding: story ? `56px 72px ${STORY_SAFE_BOTTOM}px` : '32px 72px 56px',
          gap: story ? 24 : 16, boxSizing: 'border-box',
        }}
      >
        {kicker}
        {title(story ? 80 : 64)}
        {body(story ? 34 : 28, story ? 0.76 : 0.78)}
        {footer}
      </div>
    </>
  )
}

// Układy B i C - na razie rysują układ A (osobne ciała dochodzą później).
const LayoutPanorama = LayoutZdjecie
const LayoutArchiwum = LayoutZdjecie

const LAYOUTS: Record<CiekawostkaLayout, (parts: CiekawostkaParts) => ReactElement> = {
  zdjecie: LayoutZdjecie,
  panorama: LayoutPanorama,
  archiwum: LayoutArchiwum,
}
