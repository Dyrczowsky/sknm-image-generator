import { colors, fontMono } from './theme'
import { sygnetZloty } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { InfoLine } from './blocks/InfoLine'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'

// 1g · GALA — złoto na grafitowym
export function Poster1g({ data }) {
  const { title, subtitle, event_date, event_time, location, logos } = withPlaceholders(data)

  return (
    <PosterFrame background={colors.ink} color={colors.goldPanelText} padding={72}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880, height: 700, background: colors.inkPanel, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: 436, left: 0, right: 0, height: 1, background: `linear-gradient(to right, rgba(184,148,58,0) 0, ${colors.gold} 18%, ${colors.gold} 82%, rgba(184,148,58,0) 100%)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetZloty} alt="SKNM" style={{ width: 136, display: 'block' }} />
        <BrandingText lines={['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} color={colors.gold} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, position: 'relative', zIndex: 1 }}>
        <Badge color={colors.gold} style={{ font: `700 24px ${fontMono}`, letterSpacing: '.2em' }}>GALA SKNM</Badge>
        <div style={{ fontSize: 126, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.4, color: colors.creamMuted, maxWidth: '26ch' }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} color={colors.gold} />
          <InfoLine parts={[event_time, location]} style={{ paddingBottom: 10 }} />
        </div>
        <LogoRow>
          <LogoSlot logo={logos.pk} variant="dark" width={190} height={72} />
          <PlaceholderBox label="patronat" width={190} height={72} style={{ borderColor: 'rgba(184,148,58,.5)', color: 'rgba(240,237,228,.7)' }} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
