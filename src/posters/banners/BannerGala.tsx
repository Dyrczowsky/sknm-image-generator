import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { BrandingText } from '../blocks/BrandingText'
import { useBannerLayout, usePosterShape } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// GALA (baner) — złota linia pod nagłówkiem, nazwa koła, złote akcenty.
export function BannerGala({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('gala', scheme, accent)
  const copy = bannerCopy(lang)
  const { kx, ky } = usePosterShape()
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880 * kx, height: 700 * ky, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: padY + 108, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent 0, var(--gold) 18%, var(--gold) 82%, transparent 100%)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <BrandingText lines={['SKNM', ...copy.university.toUpperCase().split(' ')]} color="var(--gold)" style={{ fontSize: 18 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
        <Badge color="var(--gold)" style={{ font: `700 ${18 * textScale}px ${fontMono}`, letterSpacing: '.2em' }}>{copy.university}</Badge>
        <div style={{ fontSize: 78 * titleScale, lineHeight: 0.96, maxWidth: 940, fontWeight: 800, letterSpacing: '-.035em', fontKerning: 'none', textWrap: 'balance' }}>
          {copy.name}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ font: `700 18px ${fontMono}`, letterSpacing: '.14em', color: 'var(--gold)', paddingBottom: 6 }}>{BANNER_SITE}</div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
