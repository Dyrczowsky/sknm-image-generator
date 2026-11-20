import type { CSSProperties } from 'react'
import type { ListItem, PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { PosterText } from '../blocks/PosterText'
import { resolveScheme } from '../schemes'
import { useBannerLayout, usePosterShape } from '../shape'
import { fontMono, leading } from '../theme'
import { Badge } from '../blocks/Badge'
import { BrandingText } from '../blocks/BrandingText'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { KonferencjaAgenda } from '../KonferencjaAgenda'
import { BANNER_SYGNET_W, BannerFooter, NAME_TRACKING, BannerEventLine } from './common'

// Baner ma ~360 px wysokości na program: 10 punktów w dwóch kolumnach
// mieści się dopiero przy ~1/3 rozmiaru tekstu plakatu.
const MIN_SCALE = 0.3
const MIN_PAD = 3
// Od tylu punktów program idzie od razu w dwie kolumny (jedna byłaby za drobna).
const TWO_COLUMNS_FROM = 4

const DEFAULT_AGENDA: ListItem[] = [
  { time: '18:00', title: 'Otwarcie gali', subtitle: 'powitanie gości' },
  { time: '18:30', title: 'Wręczenie wyróżnień' },
  { time: '20:00', title: 'Bankiet' },
]

// Linie programu w złocie Gali (schemat Gali nie ma ról linii Konferencji).
const AGENDA_VARS = {
  '--line-first': 'var(--gold)',
  '--line-rest': 'color-mix(in srgb, var(--gold) 35%, transparent)',
} as CSSProperties

// GALA z harmonogramem (baner) — kolory i złota linia Gali, po lewej nazwa
// koła, po prawej program (lista `agenda`, wspólna z Konferencją).
export function BannerGalaHarmonogram({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, logoSlots, qrUrl, qrSide, lists, titleScale, textScale, fillAgenda } = withPlaceholders(data)
  const agenda = lists.agenda?.length ? lists.agenda : DEFAULT_AGENDA
  const { cssVars, sygnet, logoVariant } = resolveScheme('gala', scheme, accent)
  const { kx, ky } = usePosterShape()
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px`, gap: 20 }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880 * kx, height: 700 * ky, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: padY + 100, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent 0, var(--gold) 18%, var(--gold) 82%, transparent 100%)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
        <BrandingText lines={[SITE_URL.toUpperCase()]} color="var(--gold)" style={{ fontSize: 18 }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 32, marginTop: 28, position: 'relative', zIndex: 1 }}>
        <div style={{ flex: '0 0 290px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge color="var(--gold)" style={{ font: `700 ${18 * textScale}px ${fontMono}`, letterSpacing: '.2em' }}>SKNM</Badge>
          <PosterText path="bannerTitle" value={raw.bannerTitle} fallback={CLUB_NAME[lang]} multiline label="Tekst banera" style={{ fontSize: 34 * titleScale, lineHeight: leading(1.02, titleScale), fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }} />
          <BannerEventLine data={data} lang={lang} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', ...AGENDA_VARS }}>
          <KonferencjaAgenda agenda={agenda} seed={DEFAULT_AGENDA} startPad={12} spread={fillAgenda} grow={false} canGrow={false} timeColor="var(--gold)" minScale={MIN_SCALE} minPad={MIN_PAD} startColumns={agenda.length > TWO_COLUMNS_FROM ? 2 : 1} compact />
        </div>
      </div>

      <BannerFooter qrUrl={qrUrl} qrSide={qrSide} slots={logoSlots} variant={logoVariant} gap={32} style={{ position: 'relative', zIndex: 1 }} />
    </PosterFrame>
  )
}
