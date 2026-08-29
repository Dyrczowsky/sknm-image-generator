import { fontMono } from './theme'
import { sygnetByName } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { getDay, getMonthShort } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { InfoLine } from './blocks/InfoLine'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'
import type { PosterProps } from '../types'

// REKRUTACJA — wzór z sygnetu
export function PosterRekrutacja({ data, scheme }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, logos, hidden, fx } = withPlaceholders(data)
  const s = resolveScheme('rekrutacja', scheme)

  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 340, background: 'var(--band)',
          clipPath: 'polygon(0 42%,8.33% 0,16.66% 42%,25% 0,33.33% 42%,41.66% 0,50% 42%,58.33% 0,66.66% 42%,75% 0,83.33% 42%,91.66% 0,100% 42%,100% 100%,0 100%)',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, position: 'relative', maxWidth: 900 }}>
        <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 0.88, letterSpacing: '-.045em', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        <div style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.3, color: 'var(--sub-color)', ...fx('subtitle') }}>
          {subtitle || 'Seminaria, konkursy, wyjazdy i własne projekty badawcze. Każdy rok studiów, każdy wydział.'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', color: 'var(--footer-text)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
          <Badge color="var(--badge-color)" style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em', ...fx('badge') }}>{badge || 'SPOTKANIE ORGANIZACYJNE'}</Badge>
          <InfoLine
            parts={[
              { text: `${getDay(event_date)} ${getMonthShort(event_date)}`, hidden: hidden('event_date') },
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.05, fontKerning: 'none' }}
          />
          <div style={{ fontSize: 26, fontWeight: 500, opacity: 0.85 }}>sknm.pk.edu.pl · @sknm.pk</div>
        </div>
        <LogoRow alignItems="flex-end">
          <PlaceholderBox label="kod QR" width={130} height={130} style={{ borderColor: 'var(--qr-border)', color: 'var(--qr-text)' }} />
          <LogoSlot logo={logos.pk} variant={s.logoVariant} width={180} height={68} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
