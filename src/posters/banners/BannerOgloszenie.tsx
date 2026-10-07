import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { BannerLogos, MarginChips, NAME_TRACKING } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// OGŁOSZENIE (baner) — wyśrodkowana nazwa koła pod sygnetem.
export function BannerOgloszenie({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('ogloszenie', scheme, accent)
  const copy = bannerCopy(lang)
  const { padX, padY } = useBannerLayout()
  const margin = padX - BANNER_PAD
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <MarginChips margin={margin} colors={['var(--accent)', 'var(--accent)', 'var(--accent)']} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 92, display: 'block' }} />
        <div style={{ fontSize: 58 * titleScale, fontWeight: 800, lineHeight: 1.04, letterSpacing: NAME_TRACKING, maxWidth: '30ch', textWrap: 'balance', fontKerning: 'none' }}>
          {copy.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 26, height: 22, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ font: `700 ${19 * textScale}px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)' }}>{BANNER_SITE.toUpperCase()}</div>
          <div style={{ width: 26, height: 22, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 24 }}>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
