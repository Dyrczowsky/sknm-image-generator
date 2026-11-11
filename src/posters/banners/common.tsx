import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { toPlain } from '../../richText'
import { getDay, getMonthShort } from '../../utils/formatDate'
import { PosterFooter } from '../blocks/PosterFooter'
import type { LogoSlotSource } from '../blocks/LogoSlots'
import { PosterText } from '../blocks/PosterText'
import { usePosterEdit } from '../edit'
import { Triangle } from '../blocks/Triangle'
import { BANNER_QR, TITLE_TRACKING, leading, typography } from '../theme'
import { hasBannerEvent } from './eventLine'
import type { LogoVariant, PosterLang, QrSide, RawPosterData } from '../../types'

// Skala banera (wysokość układu 624 px): sygnet i kod QR są mniejsze niż na
// plakacie 1080 px, logotypy zostają na LOGO_HEIGHT (to ich minimum).
export const BANNER_SYGNET_W = 88
// Światło między literami nazwy koła - to samo co w tytułach plakatów.
export const NAME_TRACKING = TITLE_TRACKING

// Poniżej tej szerokości marginesu stos trójkątów by się nie zmieścił.
const MIN_CHIPS_MARGIN = 120

interface MarginChipsProps {
  // Szerokość bocznego marginesu poza bezpieczną kolumną (0 = brak marginesu).
  margin: number
  colors: [string, string, string]
}

// Dekoracja bocznych marginesów okładki strony: po obu stronach stos trzech
// trójkątów (motyw sygnetu). Marginesy są przycinane na telefonie, więc nie
// niosą treści; w banerze bez marginesu (wydarzenie) dekoracja znika.
export function MarginChips({ margin, colors }: MarginChipsProps) {
  if (margin < MIN_CHIPS_MARGIN) return null
  const stack = (side: 'left' | 'right') => (
    <div style={{ position: 'absolute', top: 0, bottom: 0, [side]: 0, width: margin, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      {colors.map((color, i) => (
        <Triangle key={i} width={84} height={70} color={color} />
      ))}
    </div>
  )
  return (
    <>
      {stack('left')}
      {stack('right')}
    </>
  )
}

interface BannerFooterProps {
  qrUrl: string
  qrSide: QrSide
  lead?: ReactNode
  slots: LogoSlotSource[]
  variant?: LogoVariant
  slotStyle?: CSSProperties
  gap?: number
  rowStyle?: CSSProperties
  logosStyle?: CSSProperties
  style?: CSSProperties
}

// Stopka banera: ta sama PosterFooter co w plakatach, z mniejszym kodem QR.
// Baner jest za niski na osobny wiersz nad stopką, więc kod zawsze stoi w
// rzędzie: na lewym marginesie (przed treścią `lead`) albo przy logotypach.
export function BannerFooter(props: BannerFooterProps) {
  return <PosterFooter {...props} qrPlacement="inline" qrSizing={BANNER_QR} />
}

interface BannerEventLineProps {
  data: RawPosterData
  lang: PosterLang
  style?: CSSProperties
}

// Linia „data · godzina · miejsce” pod dużym tekstem banera. Wartości są
// wspólne z plakatem, ale na banerze pokazują się tylko po włączeniu
// `bannerShowEvent` - oko z formularza plakatu nic tu nie zmienia. W
// przeciwieństwie do plakatów puste pole znika (bez wartości przykładowych),
// a bez żadnej części linii nie ma wcale.
export function BannerEventLine({ data, lang, style }: BannerEventLineProps) {
  const { editable } = usePosterEdit()
  if (!hasBannerEvent(data, editable)) return null
  const date = data.event_date ?? ''
  const time = data.event_time ?? ''
  const location = data.location ?? ''
  const parts: ReactNode[] = []
  if (date) parts.push(`${getDay(date)} ${getMonthShort(date, { lang })}`)
  if (time) parts.push(time)
  // W edycji puste miejsce zostaje polem z podpowiedzią (patrz `hasBannerEvent`);
  // w eksporcie i miniaturach puste pole znika.
  if (editable || toPlain(location) !== '') parts.push(<PosterText path="location" value={location} fallback="Lokalizacja" as="span" inline label="Lokalizacja" />)
  const textScale = data.textScale ?? 1
  return (
    <div style={{ ...typography.body, fontSize: typography.body.fontSize * textScale, lineHeight: leading(typography.body.lineHeight, textScale), ...style }}>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {part}
        </Fragment>
      ))}
    </div>
  )
}

// Blok tytułu przypięty od góry (#67): odstęp nad nim trzyma tytuł w miejscu, a
// blok za nim dostaje TITLE_BLOCK_FLEX, więc Enter dokłada wiersz w dół zamiast
// przesuwać tytuł w górę jak przy wyśrodkowaniu. Gdy tekstu jest za dużo,
// odstęp się kurczy (do 0), żeby stopka nie wyjechała poza baner.
// `height`: o ile niżej niż bez odstępu stał tytuł domyślny przed zmianą.
// `gap`: odstęp kolumny-rodzica - ujemny margines go znosi, więc skurczony
// odstęp daje ten sam układ co przed zmianą.
export function TitleSpacer({ height, gap = 0 }: { height: number; gap?: number }) {
  return <div aria-hidden style={{ flex: `0 1 ${height}px`, marginBottom: -gap }} />
}

export const TITLE_BLOCK_FLEX = '1 0 auto'
