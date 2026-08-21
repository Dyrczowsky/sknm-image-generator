import { colors } from './theme'
import { sygnetNegatywny } from './logos'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { InfoLine } from './blocks/InfoLine'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'

// 1a · WYKŁAD — typografia
export function Poster1a({ data }) {
  const { title, subtitle, speaker, event_date, event_time, location, logos } = withPlaceholders(data)

  return (
    <PosterFrame background={colors.navy} color={colors.cream} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetNegatywny} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}>
        <Badge background={colors.lime} color={colors.limeText} style={{ fontSize: 24 }}>WYKŁAD OTWARTY</Badge>
        <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em' }}>
          {title}
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, color: colors.lime }}>{speaker}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} />
          <InfoLine parts={[event_time, location]} secondLine={subtitle} style={{ paddingBottom: 10 }} />
        </div>
        <LogoRow alignItems="center">
          <LogoSlot logo={logos.pk} variant="dark" width={200} height={76} />
          <LogoSlot logo={logos.faculty} variant="dark" width={200} height={76} />
        </LogoRow>
      </div>

      <div style={{ position: 'absolute', top: 0, right: 0, width: 700, height: 600, background: 'rgba(255,255,255,.055)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920, height: 780, background: colors.navyLight, opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520, height: 300, background: colors.navyDark, clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
      <div style={{ position: 'absolute', left: 18, top: 392, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 38, height: 32, background: colors.lime, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        <div style={{ width: 38, height: 32, background: colors.lime, clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.66 }} />
        <div style={{ width: 38, height: 32, background: colors.lime, clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.33 }} />
      </div>
    </PosterFrame>
  )
}
