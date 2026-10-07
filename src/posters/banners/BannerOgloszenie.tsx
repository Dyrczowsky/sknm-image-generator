import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { BrandingText } from '../blocks/BrandingText'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import type { PosterProps } from '../../types'

// OGŁOSZENIE (baner) — wyśrodkowany cytat/komunikat, bez zdjęcia i bez daty.
export function BannerOgloszenie({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, graphics, showPkLogo, qrUrl, fx, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('ogloszenie', scheme, accent)
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <BrandingText lines={lang === 'en' ? ['SKNM', 'KRAKOW UNIVERSITY', 'OF TECHNOLOGY'] : ['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} style={{ fontSize: 18 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 18 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 34, height: 30, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 34, height: 30, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <div style={{ fontSize: 62 * titleScale, fontWeight: 800, lineHeight: 1.06, letterSpacing: '-.02em', maxWidth: '28ch', textWrap: 'balance', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ font: `700 ${19 * textScale}px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)', ...fx('subtitle') }}>— {subtitle.toUpperCase()}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ font: `700 16px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85, paddingBottom: 6 }}>sknm.pk.edu.pl</div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
