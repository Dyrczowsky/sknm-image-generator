import { sygnetByName } from '../logos'
import { resolveScheme } from '../schemes'
import { withPlaceholders } from '../fallback'
import { PosterFrame } from '../blocks/PosterFrame'
import { BrandingText } from '../blocks/BrandingText'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// DATA (baner) — wielki skrót „SKNM" w miejscu liczby dnia, obok pełna nazwa.
export function BannerData({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('data', scheme, accent)
  const copy = bannerCopy(lang)
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <BrandingText lines={[BANNER_SITE.toUpperCase()]} style={{ textAlign: 'left', fontSize: 18 }} />
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 40, margin: '-20px 0 -4px' }}>
        <div style={{ fontSize: 230, fontWeight: 800, lineHeight: 0.8, letterSpacing: '-.06em', flex: '0 0 auto' }}>SKNM</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 44 * titleScale, fontWeight: 800, lineHeight: 1, color: 'var(--month-color)', letterSpacing: '-.03em', fontKerning: 'none' }}>
            {copy.name}
          </div>
          <div style={{ fontSize: 20 * textScale, fontWeight: 500, lineHeight: 1.35, color: 'var(--muted-text)' }}>{copy.tagline}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ width: 40, height: 32, background: 'var(--tri1)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 40, height: 32, background: 'var(--tri2)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 40, height: 32, background: 'var(--tri3)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
