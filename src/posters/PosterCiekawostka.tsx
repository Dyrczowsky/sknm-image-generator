import type { CSSProperties, ReactElement, ReactNode } from 'react'
import type { CiekawostkaLayout, PosterProps, SygnetName } from '../types'
import { DEFAULT_BADGE, SITE_URL } from './copy'
import { PLACEHOLDERS, withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { fontMono, leading, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { PosterAutoFit } from './blocks/PosterAutoFit'
import { posterFit, posterFitMin } from './blocks/posterFit'
import { PosterFooter } from './blocks/PosterFooter'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterText } from './blocks/PosterText'
import { Sygnet } from './blocks/Sygnet'
import { PhotoGallery } from './PhotoGallery'
import { toPlain } from '../richText'

// Ostrzeżenie w edytorze, gdy opis nie mieści się nawet po zmniejszeniu.
const BODY_NOTICE = 'Opis nie mieści się — skróć tekst albo zmniejsz rozmiar tytułu lub tekstu.'

// Story 1080×1920: górne 250 px i dolne 340 px zasłania interfejs Instagrama -
// tam tylko zdjęcie i tło, bez tekstu, sygnetu, logo i kodu QR.
const STORY_SAFE_TOP = 250
const STORY_SAFE_BOTTOM = 340

// Najmniejszy font opisu (px) przy dopasowaniu - próg czytelności, niezależny
// od suwaka „Rozmiar tekstu”.
const BODY_FLOOR_PX = 22
const BODY_FLOOR_PX_STORY = 26

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
  // Opis w pudełku, które samo zmniejsza font: od `size` × suwak do progu
  // czytelności (22 px, w Story 26 px).
  body: (size: number) => ReactNode
  footer: ReactNode
  // Zdjęcie (galeria) w podanym kadrze; `children` nakładają się na zdjęcie.
  photo: (style: CSSProperties, label: ReactNode, children?: ReactNode) => ReactNode
  // Duży rok w tle (tylko układ C): `null`, gdy pole jest puste (wpisuje się
  // go w formularzu). `style` to rozmiar i położenie.
  year: (style: CSSProperties) => ReactNode
  // Nagłówek układów B i C: etykieta po lewej, sygnet po prawej.
  header: ReactNode
}

// CIEKAWOSTKA — „Czy wiesz, że…?”: zdjęcie, pytanie i akapit historii.
export function PosterCiekawostka({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, logoSlots, qrUrl, qrSide, qrPlacement, photos, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('ciekawostka', scheme, accent)
  const { shape, width, height } = usePosterShape()
  const story = shape === 'story'
  const showYear = toPlain(raw.year ?? '').trim() !== ''
  const bodyFloor = story ? BODY_FLOOR_PX_STORY : BODY_FLOOR_PX

  const kicker = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...fx('badge') }}>
      <div style={{ width: 22, height: 19, flex: '0 0 auto', background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
      <Badge color="var(--accent)" field={{ path: 'badge', value: raw.badge, fallback: DEFAULT_BADGE.ciekawostka[lang], label: 'Etykieta' }} />
    </div>
  )

  const parts: CiekawostkaParts = {
    story,
    width,
    height,
    sygnet,
    kicker,
    // Sygnet leży na tle strony - schemat dobiera go właśnie do tego tła.
    header: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flex: '0 0 auto' }}>
        {kicker}
        <Sygnet name={sygnet} width={story ? 132 : 104} />
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
    body: (size) => (
      <PosterAutoFit min={posterFitMin(bodyFloor, size * textScale)} notice={BODY_NOTICE} style={{ flex: 1, minHeight: 0 }}>
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
    // Dekoracja pod treścią (`zIndex: 0`), zasłonięta przez nią - rok wpisuje
    // się w formularzu, nie na plakacie.
    year: (style) => showYear ? (
      <PosterText
        path="year"
        value={raw.year}
        label="Rok"
        style={{
          position: 'absolute', zIndex: 0, fontWeight: 800, lineHeight: 1, letterSpacing: '-.05em',
          color: 'var(--accent)', opacity: 0.14, whiteSpace: 'nowrap',
          pointerEvents: 'none', ...style, ...fx('year'),
        }}
      />
    ) : null,
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
// Zdjęcie ustępuje pierwsze: gdy tekst (dłuższy tytuł, kod QR nad stopką,
// większy suwak) potrzebuje miejsca, zdjęcie maleje do `photoMin`, a dopiero
// potem opis zmniejsza font. Krótki tekst - zdjęcie trochę rośnie.
function LayoutZdjecie({ story, width, height, sygnet, kicker, title, body, footer, photo }: CiekawostkaParts) {
  const photoH = story ? 900 : Math.round((height * 540) / 1080)
  const photoMin = story ? 700 : Math.round((height * 380) / 1080)
  // Trójkąt w kolorze tła strony (metal: `--sygnet-bg`, też ciemne tło) -
  // sygnet ze schematu jest dobrany do tła strony, a na trójkącie w kolorze
  // akcentu ginąłby (granat na granacie w schemacie kremowym). W Story sygnet
  // schodzi poniżej strefy zasłanianej przez Instagram, więc trójkąt jest
  // większy, żeby sygnet dalej w nim siedział.
  const tri = story ? 520 : 420
  // Trójkąt nie wyższy niż zdjęcie, gdy to zmaleje (zostaje kąt 45°).
  const triSize = `min(${tri}px, 100%)`
  const sygnetTop = story ? STORY_SAFE_TOP + 22 : 72

  return (
    <>
      {photo(
        // Duży współczynnik kurczenia: przy braku miejsca maleje prawie tylko
        // zdjęcie (treść kurczy się dopiero, gdy zdjęcie dojdzie do minimum).
        { flex: `1 1000 ${photoH}px`, minHeight: photoMin },
        <>stare zdjęcie grupowe<br />{`${width} × ${photoH}`}</>,
        <div style={{ position: 'absolute', top: 0, left: 0, height: triSize, aspectRatio: '1', background: 'var(--sygnet-bg, var(--page-bg))', clipPath: 'polygon(0 0,100% 0,0 100%)', padding: `${sygnetTop}px 0 0 72px`, boxSizing: 'border-box' }}>
          <Sygnet name={sygnet} />
        </div>,
      )}
      <div style={{ height: 2, flex: '0 0 auto', background: 'linear-gradient(to right, transparent, var(--accent) 15%, var(--accent) 85%, transparent)' }} />
      <div
        style={{
          flex: '0 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column',
          padding: story ? `56px 72px ${STORY_SAFE_BOTTOM}px` : '32px 72px 56px',
          gap: story ? 24 : 16, boxSizing: 'border-box',
        }}
      >
        {kicker}
        {title(story ? 80 : 64)}
        {body(story ? 34 : 28)}
        {footer}
      </div>
    </>
  )
}

// Margines treści układów B i C; w Story treść omija strefy Instagrama.
function contentPadding(story: boolean): string {
  return story ? `${STORY_SAFE_TOP}px 72px ${STORY_SAFE_BOTTOM}px` : '72px'
}

// B — „Panorama”: tekst prowadzi; zdjęcie to cienki pas od krawędzi do
// krawędzi między tytułem a opisem, więc na opis zostaje najwięcej miejsca.
function LayoutPanorama({ story, width, height, header, title, body, footer, photo }: CiekawostkaParts) {
  const photoH = story ? 380 : Math.round((height * 210) / 1080)
  return (
    <div
      style={{
        flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
        padding: contentPadding(story), gap: story ? 32 : 24, boxSizing: 'border-box',
      }}
    >
      {header}
      {title(story ? 88 : 76)}
      {/* Pas wychodzi na boczne marginesy aż do krawędzi kadru. */}
      {photo({ height: photoH, margin: '0 -72px' }, `panorama · ${width} × ${photoH}`)}
      {body(story ? 36 : 30)}
      {footer}
    </div>
  )
}

// C — „Archiwum”: zdjęcie jako „odbitka” w ramce, lekko obrócona, obok tytułu
// (w Story nad nim), pod spodem opis; opcjonalny duży rok w tle. Ramka ma kolor
// tekstu strony, więc jest jasna na ciemnym i ciemna na jasnym tle.
function LayoutArchiwum({ story, width, height, header, title, body, footer, photo, year }: CiekawostkaParts) {
  const [printW, printH] = story ? [760, 570] : [440, 330]
  const frame = 14
  const print = photo(
    { width: printW, height: printH, outline: `${frame}px solid var(--page-text)`, transform: 'rotate(-2deg)', margin: frame + 6 },
    <>zdjęcie<br />{`${printW} × ${printH}`}</>,
  )
  // Kwadrat: rok lekko wychodzi za prawą krawędź (jak w makiecie); w Story
  // i w druku zostaje w kadrze (4 cyfry muszą się zmieścić w 1080 px).
  const right = !story && width === height ? -24 : 40
  return (
    <>
      {/* W Story rok stoi za tytułem - wyżej zasłoniłaby go duża odbitka. */}
      {year(story ? { fontSize: 480, top: 900, right: 24 } : { fontSize: 380, top: 120, right })}
      <div
        style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1,
          padding: contentPadding(story), gap: story ? 28 : 20, boxSizing: 'border-box',
        }}
      >
        {header}
        {story ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>{print}</div>
            {title(80)}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: '0 0 auto' }}>
            {print}
            <div style={{ flex: 1, minWidth: 0 }}>{title(60)}</div>
          </div>
        )}
        {body(story ? 34 : 30)}
        {footer}
      </div>
    </>
  )
}

const LAYOUTS: Record<CiekawostkaLayout, (parts: CiekawostkaParts) => ReactElement> = {
  zdjecie: LayoutZdjecie,
  panorama: LayoutPanorama,
  archiwum: LayoutArchiwum,
}
