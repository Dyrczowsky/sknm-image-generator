import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { fontMono } from '../theme'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { BANNER_SYGNET_W, BannerLogos, MarginChips, NAME_TRACKING } from './common'

// DATA (baner) — wielki skrót „SKNM" w miejscu liczby dnia, pod nim pełna nazwa.
export function BannerData({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('data', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <MarginChips margin={padX - BANNER_PAD} colors={['var(--tri1)', 'var(--tri2)', 'var(--tri3)']} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div />
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -64 }}>
        <div style={{ fontSize: 250, fontWeight: 800, lineHeight: 0.78, letterSpacing: '-.03em' }}>SKNM</div>
        <div style={{ fontSize: 35 * titleScale, fontWeight: 800, lineHeight: 1.05, color: 'var(--month-color)', letterSpacing: NAME_TRACKING, fontKerning: 'none' }}>
          {CLUB_NAME[lang]}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ font: `700 ${18 * textScale}px ${fontMono}`, letterSpacing: '.12em', paddingBottom: 6 }}>{SITE_URL}</div>
        <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>
    </PosterFrame>
  )
}
