import { LOGO_CLEAR } from './theme'
import { sygnetByName } from './logos'
import { LogoSlots } from './blocks/LogoSlots'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { InfoLine } from './blocks/InfoLine'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'
import type { PosterProps } from '../types'

// WYKŁAD — typografia
export function PosterWyklad({ data, scheme }: PosterProps) {
  const { title, subtitle, speaker, event_date, event_time, location, badge, graphics, showPkLogo, hidden, fx } = withPlaceholders(data)
  const s = resolveScheme('wyklad', scheme)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}>
        <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ fontSize: 24, ...fx('badge') }}>{badge || 'WYKŁAD OTWARTY'}</Badge>
        <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, color: 'var(--speaker)', ...fx('speaker') }}>{speaker}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} style={fx('event_date')} />
          <InfoLine
            parts={[
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            secondLine={subtitle}
            secondLineHidden={hidden('subtitle')}
            style={{ paddingBottom: 10, whiteSpace: 'nowrap' }}
          />
        </div>
        <LogoRow alignItems="flex-end" gap={LOGO_CLEAR}>
          <LogoSlots slots={slots} variant={s.logoVariant} flush={['r', 'b']} />
        </LogoRow>
      </div>

      <div style={{ position: 'absolute', top: 0, right: 0, width: 700, height: 600, background: 'var(--wash-top)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920, height: 780, background: 'var(--wedge-br)', opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520, height: 300, background: 'var(--wedge-bl)', clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
      <div style={{ position: 'absolute', left: 18, bottom: 72, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 38, height: 32, background: 'var(--chips)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        <div style={{ width: 38, height: 32, background: 'var(--chips)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.66 }} />
        <div style={{ width: 38, height: 32, background: 'var(--chips)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.33 }} />
      </div>
    </PosterFrame>
  )
}
