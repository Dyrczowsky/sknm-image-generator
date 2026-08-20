import { colors, fontMono, posterBaseStyle } from './theme'
import { sygnetZloty } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'

// 1g · GALA — złoto na grafitowym
export function Poster1g({ data }) {
  const { title, subtitle, event_date, event_time, location, logo } = withPlaceholders(data)

  return (
    <div style={{ ...posterBaseStyle, background: colors.ink, color: colors.goldPanelText, padding: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880, height: 700, background: colors.inkPanel, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: 436, left: 0, right: 0, height: 1, background: `linear-gradient(to right, rgba(184,148,58,0) 0, ${colors.gold} 18%, ${colors.gold} 82%, rgba(184,148,58,0) 100%)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetZloty} alt="SKNM" style={{ width: 136, display: 'block' }} />
        <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.16em', textAlign: 'right', lineHeight: 1.7, color: colors.gold }}>
          STUDENCKIE KOŁO<br />NAUKOWE MATEMATYKÓW<br />POLITECHNIKI KRAKOWSKIEJ
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, position: 'relative', zIndex: 1 }}>
        <div style={{ font: `700 24px ${fontMono}`, letterSpacing: '.2em', color: colors.gold }}>GALA SKNM</div>
        <div style={{ fontSize: 126, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.4, color: colors.creamMuted, maxWidth: '26ch' }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.86, letterSpacing: '-.04em', whiteSpace: 'nowrap', flex: '0 0 auto', color: colors.gold }}>
            {getDay(event_date)}
            <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: 0 }}> {getMonthShort(event_date, { upperCase: true })}</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4, paddingBottom: 10 }}>
            {[event_time, location].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <LogoSlot logo={logo} variant="dark" width={190} height={72} />
          <PlaceholderBox label="patronat" width={190} height={72} style={{ borderColor: 'rgba(184,148,58,.5)', color: 'rgba(240,237,228,.7)' }} />
        </div>
      </div>
    </div>
  )
}
