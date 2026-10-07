import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { BrandingText } from '../blocks/BrandingText'
import { useBannerLayout, usePosterShape } from '../shape'
import { BANNER_SYGNET_W, BannerLogos, NAME_TRACKING } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// WYKŁAD (baner) — nazwa koła na tle klinów, stos trójkątów przy lewej krawędzi.
export function BannerWyklad({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, titleScale } = withPlaceholders(data)
  const s = resolveScheme('wyklad', scheme, accent)
  const copy = bannerCopy(lang)
  const { kx, ky } = usePosterShape()
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <BrandingText lines={[BANNER_SITE.toUpperCase()]} opacity={0.85} style={{ fontSize: 18 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 76 * titleScale, lineHeight: 0.96, maxWidth: 960, fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
          {copy.name}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 24, position: 'relative', zIndex: 1 }}>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>

      <div style={{ position: 'absolute', top: 0, right: 0, width: 700 * kx, height: 600 * ky, background: 'var(--wash-top)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920 * kx, height: 780 * ky, background: 'var(--wedge-br)', opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520 * kx, height: 300 * ky, background: 'var(--wedge-bl)', clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
      <div style={{ position: 'absolute', left: padX - 36, bottom: padY, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 24, height: 20, background: 'var(--chips)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        <div style={{ width: 24, height: 20, background: 'var(--chips)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.66 }} />
        <div style={{ width: 24, height: 20, background: 'var(--chips)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.33 }} />
      </div>
    </PosterFrame>
  )
}
