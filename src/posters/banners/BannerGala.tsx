import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { useBannerLayout, usePosterShape } from '../shape'
import { fontMono } from '../theme'
import { Badge } from '../blocks/Badge'
import { BrandingText } from '../blocks/BrandingText'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { BANNER_SYGNET_W, BannerLogos, NAME_TRACKING } from './common'

// GALA (baner) — złota linia pod nagłówkiem, nazwa koła, złote akcenty.
export function BannerGala({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('gala', scheme, accent)
  const { kx, ky } = usePosterShape()
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880 * kx, height: 700 * ky, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: padY + 100, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent 0, var(--gold) 18%, var(--gold) 82%, transparent 100%)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
        <BrandingText lines={[SITE_URL.toUpperCase()]} color="var(--gold)" style={{ fontSize: 18 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
        <Badge color="var(--gold)" style={{ font: `700 ${18 * textScale}px ${fontMono}`, letterSpacing: '.2em' }}>SKNM</Badge>
        <div style={{ fontSize: 66 * titleScale, lineHeight: 0.98, maxWidth: 1000, fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
          {CLUB_NAME[lang]}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 32, position: 'relative', zIndex: 1 }}>
        <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>
    </PosterFrame>
  )
}
