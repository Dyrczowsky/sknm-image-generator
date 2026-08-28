import { colors, fontMono } from './theme'
import { sygnetGranat } from './logos'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { PosterFrame } from './blocks/PosterFrame'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'

// 1l · OGŁOSZENIE — wariant jasny (granat na jasnym)
export function Poster1lJasny({ data }) {
  const { title, subtitle, logos } = withPlaceholders(data)

  return (
    <PosterFrame background={colors.cream} color={colors.limeText} padding={96}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <img src={sygnetGranat} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 32 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 46, height: 40, background: colors.navy, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 46, height: 40, background: colors.navy, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.02em', maxWidth: '18ch', textWrap: 'balance', fontKerning: 'none' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ font: `700 24px ${fontMono}`, letterSpacing: '.1em', color: colors.navy }}>— {subtitle.toUpperCase()}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85 }}>sknm.pk.edu.pl</div>
        <LogoRow>
          <LogoSlot logo={logos.pk} variant="light" width={190} height={72} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
