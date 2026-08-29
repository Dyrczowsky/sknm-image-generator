import { fontMono } from './theme'
import { sygnetByName } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { InfoLine } from './blocks/InfoLine'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'

// GALA — złoto na grafitowym
export function PosterGala({ data, scheme }) {
  const { title, subtitle, event_date, event_time, location, badge, logos } = withPlaceholders(data)
  const s = resolveScheme('gala', scheme)

  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880, height: 700, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: 232, left: 0, right: 0, height: 1, background: `linear-gradient(to right, rgba(132,117,78,0) 0, var(--gold) 18%, var(--gold) 82%, rgba(132,117,78,0) 100%)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet]} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} color="var(--gold)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, position: 'relative', zIndex: 1 }}>
        <Badge color="var(--gold)" style={{ font: `700 24px ${fontMono}`, letterSpacing: '.2em' }}>{badge || 'GALA SKNM'}</Badge>
        <div style={{ fontSize: 126, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em', fontKerning: 'none' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.4, color: 'var(--muted-text)', maxWidth: '26ch' }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} color="var(--gold)" />
          <InfoLine parts={[event_time, location]} style={{ paddingBottom: 10 }} />
        </div>
        <LogoRow>
          <LogoSlot logo={logos.pk} variant={s.logoVariant} width={190} height={72} />
          <PlaceholderBox label="patronat" width={190} height={72} style={{ borderColor: 'var(--patron-border)', color: 'var(--patron-text)' }} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
