import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { PosterText } from '../blocks/PosterText'
import { resolveScheme } from '../schemes'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { fontMono, leading } from '../theme'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { Triangle } from '../blocks/Triangle'
import { BannerFooter, MarginChips, NAME_TRACKING, BannerEventLine, TitleSpacer, TITLE_BLOCK_FLEX } from './common'

// OGŁOSZENIE (baner) — wyśrodkowana nazwa koła pod sygnetem.
export function BannerOgloszenie({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, logoSlots, qrUrl, qrSide, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('ogloszenie', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <MarginChips margin={padX - BANNER_PAD} colors={['var(--accent)', 'var(--accent)', 'var(--accent)']} />
      <TitleSpacer height={96} />
      <div style={{ flex: TITLE_BLOCK_FLEX, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <Sygnet name={sygnet} width={92} />
        <PosterText path="bannerTitle" value={raw.bannerTitle} fallback={CLUB_NAME[lang]} multiline label="Tekst banera" style={{ fontSize: 58 * titleScale, fontWeight: 800, lineHeight: leading(1.04, titleScale), letterSpacing: NAME_TRACKING, maxWidth: '30ch', textWrap: 'balance', fontKerning: 'none' }} />
        <BannerEventLine data={data} lang={lang} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Triangle width={26} height={22} color="var(--accent)" />
          <div style={{ font: `700 ${19 * textScale}px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)' }}>{SITE_URL.toUpperCase()}</div>
          <Triangle width={26} height={22} color="var(--accent)" />
        </div>
      </div>

      <BannerFooter qrUrl={qrUrl} qrSide={qrSide} slots={logoSlots} variant={logoVariant} />
    </PosterFrame>
  )
}
