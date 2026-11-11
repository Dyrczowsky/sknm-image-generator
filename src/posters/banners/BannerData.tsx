import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { PosterText } from '../blocks/PosterText'
import { resolveScheme } from '../schemes'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { fontMono, leading } from '../theme'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { BANNER_SYGNET_W, BannerFooter, MarginChips, NAME_TRACKING, BannerEventLine, TitleSpacer, TITLE_BLOCK_FLEX } from './common'

// DATA (baner) — wielki skrót „SKNM" w miejscu liczby dnia, pod nim pełna nazwa.
export function BannerData({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, logoSlots, qrUrl, qrSide, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('data', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <MarginChips margin={padX - BANNER_PAD} colors={['var(--tri1)', 'var(--tri2)', 'var(--tri3)']} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div />
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
      </div>

      <TitleSpacer height={107} />
      <div style={{ flex: TITLE_BLOCK_FLEX, display: 'flex', flexDirection: 'column', gap: 18, marginTop: -64 }}>
        <div style={{ fontSize: 250, fontWeight: 800, lineHeight: 0.78, letterSpacing: '-.03em' }}>SKNM</div>
        <PosterText path="bannerTitle" value={raw.bannerTitle} fallback={CLUB_NAME[lang]} multiline label="Tekst banera" style={{ fontSize: 35 * titleScale, fontWeight: 800, lineHeight: leading(1.05, titleScale), color: 'var(--month-color)', letterSpacing: NAME_TRACKING, fontKerning: 'none' }} />
        <BannerEventLine data={data} lang={lang} />
      </div>

      <BannerFooter
        qrUrl={qrUrl} qrSide={qrSide} slots={logoSlots} variant={logoVariant}
        lead={<div style={{ font: `700 ${18 * textScale}px ${fontMono}`, letterSpacing: '.12em', paddingBottom: 6 }}>{SITE_URL}</div>}
      />
    </PosterFrame>
  )
}
