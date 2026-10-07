import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { useBannerLayout } from '../shape'
import { BrandingText } from '../blocks/BrandingText'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { FadingTriangles } from '../blocks/Triangle'
import { Wedges } from '../blocks/Wedges'
import { BANNER_SYGNET_W, BannerLogos, NAME_TRACKING } from './common'

// WYKŁAD (baner) — nazwa koła na tle klinów, stos trójkątów przy lewej krawędzi.
export function BannerWyklad({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, titleScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('wyklad', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
        <BrandingText lines={[SITE_URL.toUpperCase()]} opacity={0.85} style={{ fontSize: 18 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 76 * titleScale, lineHeight: 0.96, maxWidth: 960, fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
          {CLUB_NAME[lang]}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 24, position: 'relative', zIndex: 1 }}>
        <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>

      <Wedges />
      <FadingTriangles width={24} height={20} color="var(--chips)" gap={8} left={padX - 36} bottom={padY} />
    </PosterFrame>
  )
}
