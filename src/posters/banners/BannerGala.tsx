import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { BigDateNumber } from '../blocks/BigDateNumber'
import { InfoLine } from '../blocks/InfoLine'
import { BrandingText } from '../blocks/BrandingText'
import { useBannerLayout, usePosterShape } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import type { PosterProps } from '../../types'

// GALA (baner) — złota linia pod nagłówkiem, tytuł, data w stopce.
export function BannerGala({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, hidden, fx, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('gala', scheme, accent)
  const { kx, ky } = usePosterShape()
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880 * kx, height: 700 * ky, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: padY + 112, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent 0, var(--gold) 18%, var(--gold) 82%, transparent 100%)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <BrandingText lines={lang === 'en' ? ['STUDENT SCIENCE CLUB', 'OF MATHEMATICS', 'KRAKOW UNIVERSITY OF TECHNOLOGY'] : ['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} color="var(--gold)" style={{ fontSize: 18 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
        <Badge color="var(--gold)" style={{ font: `700 18px ${fontMono}`, letterSpacing: '.2em', ...fx('badge') }}>{badge || (lang === 'en' ? 'SKNM GALA' : 'GALA SKNM')}</Badge>
        <div style={{ fontSize: 70 * titleScale, fontWeight: 800, lineHeight: 0.96, letterSpacing: '-.035em', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 25 * textScale, fontWeight: 500, lineHeight: 1.35, color: 'var(--muted-text)', maxWidth: '46ch', ...fx('subtitle') }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} color="var(--gold)" style={{ fontSize: 80, ...fx('event_date') }} lang={lang} />
          <InfoLine
            parts={[
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            style={{ fontSize: 24, paddingBottom: 6, whiteSpace: 'nowrap' }}
          />
        </div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
