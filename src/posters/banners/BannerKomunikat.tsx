import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { BigDateNumber } from '../blocks/BigDateNumber'
import { BrandingText } from '../blocks/BrandingText'
import { useBannerLayout, usePosterShape } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import type { PosterProps } from '../../types'

// Ile wierszy akapitu mieści się w banerze obok nagłówka; reszta jest ucinana.
const BODY_LINES = 7

// KOMUNIKAT ROZSZERZONY (baner) — nagłówek po lewej, akapit treści po prawej.
export function BannerKomunikat({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, body, badge, event_date, graphics, showPkLogo, qrUrl, fx, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('komunikat', scheme, accent)
  const { kx, ky } = usePosterShape()
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px`, flexDirection: 'row', gap: 48 }}>
      <div style={{ flex: '0 0 42%', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge background="var(--accent)" color="var(--badge-text)" style={{ fontSize: 18, padding: '8px 14px', ...fx('badge') }}>{badge || (lang === 'en' ? 'ANNOUNCEMENT' : 'KOMUNIKAT')}</Badge>
          <div style={{ fontSize: 46 * titleScale, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.02em', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ font: `700 ${18 * textScale}px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)', ...fx('subtitle') }}>— {subtitle.toUpperCase()}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} style={{ fontSize: 72, ...fx('event_date') }} lang={lang} />
          <div style={{ font: `700 16px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85, paddingBottom: 6 }}>sknm.pk.edu.pl</div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
        <BrandingText lines={lang === 'en' ? ['SKNM', 'KRAKOW UNIVERSITY', 'OF TECHNOLOGY'] : ['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} style={{ fontSize: 18 }} />
        <div
          style={{
            fontSize: 24 * textScale, fontWeight: 500, lineHeight: 1.5, color: 'var(--muted-text)', whiteSpace: 'pre-wrap',
            display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: BODY_LINES, overflow: 'hidden',
            ...fx('body'),
          }}
        >
          {body}
        </div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} style={{ flex: '0 0 auto' }} />
      </div>

      <div style={{ position: 'absolute', top: 0, right: 0, width: 700 * kx, height: 600 * ky, background: 'var(--wash-top)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920 * kx, height: 780 * ky, background: 'var(--wedge-br)', opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520 * kx, height: 300 * ky, background: 'var(--wedge-bl)', clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
      <div style={{ position: 'absolute', left: padX - 36, bottom: padY, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 24, height: 20, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        <div style={{ width: 24, height: 20, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.66 }} />
        <div style={{ width: 24, height: 20, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.33 }} />
      </div>
    </PosterFrame>
  )
}
