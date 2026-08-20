import { colors, fontMono, posterBaseStyle } from './theme'
import { sygnetNegatywny } from './logos'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'

// 1b · GOŚĆ — zdjęcie + pas
export function Poster1b({ data }) {
  const { title, speaker, event_date, event_time, location, logo } = withPlaceholders(data)

  return (
    <div style={{ ...posterBaseStyle, background: colors.cream, color: colors.ink, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 600, position: 'relative', background: `repeating-linear-gradient(135deg, ${colors.placeholderBg} 0 10px, ${colors.placeholderBgAlt} 10px 20px)`, display: 'grid', placeItems: 'center' }}>
        <div style={{ font: `400 22px ${fontMono}`, color: colors.placeholderText, textAlign: 'center' }}>
          zdjęcie prelegenta<br />1080 × 600
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 230, height: 230, background: colors.navy, clipPath: 'polygon(0 0,100% 0,0 100%)', display: 'flex', padding: '40px 0 0 40px', boxSizing: 'border-box' }}>
          <img src={sygnetNegatywny} alt="SKNM" style={{ width: 104, height: 104, objectFit: 'contain' }} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '56px 72px 72px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -56, right: 72, background: colors.coral, color: colors.cream, padding: '18px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 0.9 }}>{getDay(event_date)}</div>
          <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.12em' }}>
            {[getMonthShort(event_date, { upperCase: true }), event_time].filter(Boolean).join(' ')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
          <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.14em', color: colors.navy }}>SEMINARIUM SKNM</div>
          <div style={{ fontSize: 82, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-.03em' }}>
            {title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 500, color: colors.textMuted, lineHeight: 1.35 }}>
            {speaker}
            <br />
            {location}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: colors.navy }}>Wstęp wolny · sknm.pk.edu.pl</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <LogoSlot logo={logo} variant="light" width={190} height={72} />
            <LogoSlot logo={logo} variant="light" width={190} height={72} />
          </div>
        </div>
      </div>
    </div>
  )
}
