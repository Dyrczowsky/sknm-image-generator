import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { useBannerLayout } from '../shape'
import { fontMono } from '../theme'
import { Badge } from '../blocks/Badge'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { FadingTriangles } from '../blocks/Triangle'
import { Wedges } from '../blocks/Wedges'
import { BANNER_SYGNET_W, BannerLogos, NAME_TRACKING } from './common'

// KOMUNIKAT ROZSZERZONY (baner) — nazwa koła na tle klinów w kolorze akcentu.
export function BannerKomunikat({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, titleScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('komunikat', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px`, flexDirection: 'row', gap: 56 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Badge background="var(--accent)" color="var(--badge-text)" style={{ fontSize: 18, padding: '8px 14px' }}>SKNM</Badge>
          <div style={{ fontSize: 62 * titleScale, lineHeight: 1, fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
            {CLUB_NAME[lang]}
          </div>
        </div>
        <div style={{ font: `700 16px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85, paddingBottom: 6 }}>{SITE_URL}</div>
      </div>

      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
        <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} style={{ flex: '0 0 auto' }} />
      </div>

      <Wedges />
      <FadingTriangles width={24} height={20} color="var(--accent)" gap={8} left={padX - 36} bottom={padY + 40} />
    </PosterFrame>
  )
}
