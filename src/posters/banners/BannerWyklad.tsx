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

// WYKŁAD (baner) — tytuł po lewej, data i logotypy po prawej, kliny w tle.
export function BannerWyklad({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, speaker, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, hidden, fx, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('wyklad', scheme, accent)
  const { kx, ky } = usePosterShape()
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px`, flexDirection: 'row', gap: 48 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20, position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ fontSize: 18, padding: '8px 14px', ...fx('badge') }}>{badge || (lang === 'en' ? 'OPEN LECTURE' : 'WYKŁAD OTWARTY')}</Badge>
          <div style={{ fontSize: 66 * titleScale, fontWeight: 800, lineHeight: 0.96, letterSpacing: '-.035em', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--speaker)', ...fx('speaker') }}>{speaker}</div>
        </div>
      </div>

      <div style={{ flex: '0 0 auto', maxWidth: 420, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, position: 'relative', zIndex: 1 }}>
        <BrandingText lines={lang === 'en' ? ['SKNM', 'KRAKOW UNIVERSITY', 'OF TECHNOLOGY'] : ['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} style={{ fontSize: 18 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, alignSelf: 'stretch' }}>
          <BigDateNumber event_date={event_date} style={{ fontSize: 84, ...fx('event_date') }} lang={lang} />
          <InfoLine
            parts={[
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            secondLine={subtitle}
            secondLineHidden={hidden('subtitle')}
            secondLineStyle={{ fontSize: 24 * textScale }}
            style={{ fontSize: 24, textAlign: 'right' }}
          />
          <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} style={{ flex: '0 0 auto', alignSelf: 'stretch' }} />
        </div>
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
