import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { toPlain } from '../../richText'
import { getDay, getMonthShort } from '../../utils/formatDate'
import { FooterLogos } from '../blocks/FooterLogos'
import type { LogoSlotSource } from '../blocks/LogoSlots'
import { PosterText } from '../blocks/PosterText'
import { Triangle } from '../blocks/Triangle'
import { TITLE_TRACKING, leading, typography } from '../theme'
import type { LogoVariant, PosterLang, RawPosterData } from '../../types'

// Skala banera (wysokość układu 624 px): sygnet i kod QR są mniejsze niż na
// plakacie 1080 px, logotypy zostają na LOGO_HEIGHT (to ich minimum).
export const BANNER_SYGNET_W = 88
export const BANNER_QR = 72
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

interface BannerLogosProps {
  qrUrl: string
  slots: LogoSlotSource[]
  variant?: LogoVariant
  slotStyle?: CSSProperties
  style?: CSSProperties
}

// Stopka banera: ten sam komplet co w plakatach (FooterLogos), z mniejszym
// kodem QR. Wrapper jest flexem, bo FooterLogos ma `flex: 1` i w kolumnie
// rozciągałby się w pionie.
export function BannerLogos({ qrUrl, slots, variant, slotStyle, style }: BannerLogosProps) {
  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, ...style }}>
      <FooterLogos qrUrl={qrUrl} slots={slots} variant={variant} qrSize={BANNER_QR} slotStyle={slotStyle} />
    </div>
  )
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
  if (!data.bannerShowEvent) return null
  const date = data.event_date ?? ''
  const time = data.event_time ?? ''
  const location = data.location ?? ''
  const parts: ReactNode[] = []
  if (date) parts.push(`${getDay(date)} ${getMonthShort(date, { lang })}`)
  if (time) parts.push(time)
  if (toPlain(location) !== '') parts.push(<PosterText path="location" value={location} as="span" inline label="Lokalizacja" />)
  if (parts.length === 0) return null
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
