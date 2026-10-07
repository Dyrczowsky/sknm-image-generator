import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { resolveScheme } from '../schemes'
import { withPlaceholders } from '../fallback'
import { PosterFrame } from '../blocks/PosterFrame'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos, MarginChips, NAME_TRACKING } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// DATA (baner) — wielki skrót „SKNM" w miejscu liczby dnia, pod nim pełna nazwa.
export function BannerData({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('data', scheme, accent)
  const copy = bannerCopy(lang)
  const { padX, padY } = useBannerLayout()
  const margin = padX - BANNER_PAD
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <MarginChips margin={margin} colors={['var(--tri1)', 'var(--tri2)', 'var(--tri3)']} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div />
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -64 }}>
        <div style={{ fontSize: 250, fontWeight: 800, lineHeight: 0.78, letterSpacing: '-.03em' }}>SKNM</div>
        <div style={{ fontSize: 35 * titleScale, fontWeight: 800, lineHeight: 1.05, color: 'var(--month-color)', letterSpacing: NAME_TRACKING, fontKerning: 'none' }}>
          {copy.name}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ font: `700 ${18 * textScale}px ${fontMono}`, letterSpacing: '.12em', paddingBottom: 6 }}>{BANNER_SITE}</div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
