import { fontMono, LOGO_CLEAR, QR_SLOT_H } from './theme'
import { sygnetByName } from './logos'
import { LogoSlots } from './blocks/LogoSlots'
import { QrSlot } from './blocks/QrSlot'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { InfoLine } from './blocks/InfoLine'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'
import type { PosterProps } from '../types'

// GALA — złoto na grafitowym
export function PosterGala({ data, scheme }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, hidden, fx } = withPlaceholders(data)
  const s = resolveScheme('gala', scheme)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880, height: 700, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: 232, left: 0, right: 0, height: 1, background: `linear-gradient(to right, rgba(132,117,78,0) 0, var(--gold) 18%, var(--gold) 82%, rgba(132,117,78,0) 100%)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} color="var(--gold)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, position: 'relative', zIndex: 1 }}>
        <Badge color="var(--gold)" style={{ font: `700 24px ${fontMono}`, letterSpacing: '.2em', ...fx('badge') }}>{badge || 'GALA SKNM'}</Badge>
        <div style={{ fontSize: 126, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.4, color: 'var(--muted-text)', maxWidth: '26ch', ...fx('subtitle') }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} color="var(--gold)" style={fx('event_date')} />
          <InfoLine
            parts={[
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            style={{ paddingBottom: 10, whiteSpace: 'nowrap' }}
          />
        </div>
        <LogoRow gap={LOGO_CLEAR} alignItems="flex-end" minHeight={QR_SLOT_H}>
          <QrSlot value={qrUrl} />
          <LogoSlots slots={slots} variant={s.logoVariant} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
