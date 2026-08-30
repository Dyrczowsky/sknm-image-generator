import { fontMono, QR_SLOT_H } from './theme'
import { sygnetByName } from './logos'
import { LogoSlots } from './blocks/LogoSlots'
import { QrSlot } from './blocks/QrSlot'
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
  const { title, subtitle, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, hidden, fx } = withPlaceholders(data)
  const s = resolveScheme('rekrutacja', scheme)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} padding={72}>
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

      {/* Pas + stopka jako jedna bryła: górna krawędź to zygzak (dekoracja),
          poniżej dolin lity granat, na którym siedzi tekst stopki. */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32,
          position: 'relative', color: 'var(--footer-text)', background: 'var(--band)',
          margin: '0 -72px -72px', padding: '150px 72px 72px',
          clipPath:
            'polygon(0 130px,8.33% 0,16.66% 130px,25% 0,33.33% 130px,41.66% 0,50% 130px,58.33% 0,66.66% 130px,75% 0,83.33% 130px,91.66% 0,100% 130px,100% 100%,0 100%)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Badge color="var(--badge-color)" style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em', ...fx('badge') }}>{badge || 'SPOTKANIE ORGANIZACYJNE'}</Badge>
          <InfoLine
            parts={[
              { text: `${getDay(event_date)} ${getMonthShort(event_date)}`, hidden: hidden('event_date') },
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.05, fontKerning: 'none', whiteSpace: 'nowrap' }}
          />
          <div style={{ fontSize: 26, fontWeight: 500, opacity: 0.85 }}>sknm.pk.edu.pl · @sknm.pk</div>
        </div>
        <LogoRow minHeight={QR_SLOT_H}>
          <QrSlot value={qrUrl} />
          <LogoSlots slots={slots} variant={s.logoVariant} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
