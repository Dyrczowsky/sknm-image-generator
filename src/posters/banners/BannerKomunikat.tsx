import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { useBannerLayout, usePosterShape } from '../shape'
import { BANNER_SYGNET_W, BannerLogos, NAME_TRACKING } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// KOMUNIKAT ROZSZERZONY (baner) — nazwa koła na tle klinów w kolorze akcentu.
export function BannerKomunikat({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, titleScale } = withPlaceholders(data)
  const s = resolveScheme('komunikat', scheme, accent)
  const copy = bannerCopy(lang)
  const { kx, ky } = usePosterShape()
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px`, flexDirection: 'row', gap: 56 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Badge background="var(--accent)" color="var(--badge-text)" style={{ fontSize: 18, padding: '8px 14px' }}>SKNM</Badge>
          <div style={{ fontSize: 62 * titleScale, lineHeight: 1, fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
            {copy.name}
          </div>
        </div>
        <div style={{ font: `700 16px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85, paddingBottom: 6 }}>{BANNER_SITE}</div>
      </div>

      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} style={{ flex: '0 0 auto' }} />
      </div>

      <div style={{ position: 'absolute', top: 0, right: 0, width: 700 * kx, height: 600 * ky, background: 'var(--wash-top)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920 * kx, height: 780 * ky, background: 'var(--wedge-br)', opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520 * kx, height: 300 * ky, background: 'var(--wedge-bl)', clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
      <div style={{ position: 'absolute', left: padX - 36, bottom: padY + 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 24, height: 20, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        <div style={{ width: 24, height: 20, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.66 }} />
        <div style={{ width: 24, height: 20, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.33 }} />
      </div>
    </PosterFrame>
  )
}
