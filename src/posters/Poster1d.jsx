import { colors, fontMono, posterBaseStyle } from './theme'
import { sygnetGranat } from './logos'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'

// 1d · DATA — liczba jako grafika
export function Poster1d({ data }) {
  const { title, subtitle, event_date, event_time, location, logo } = withPlaceholders(data)

  return (
    <div style={{ ...posterBaseStyle, background: colors.cream, color: colors.navy, padding: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.16em', lineHeight: 1.7 }}>
          WYDARZENIE<br />SKNM · PK
        </div>
        <img src={sygnetGranat} alt="SKNM" style={{ width: 120, display: 'block' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '-40px 0' }}>
        <div style={{ fontSize: 520, fontWeight: 800, lineHeight: 0.72, letterSpacing: '-.06em' }}>
          {getDay(event_date)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 28, paddingTop: 40 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.9, color: colors.coral, letterSpacing: '-.03em' }}>
            {getMonthShort(event_date, { upperCase: true })}
          </div>
          <div style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em' }}>{event_time}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
        <div
          style={{
            width: 230, height: 230, flex: '0 0 auto', borderRadius: 999,
            background: `repeating-linear-gradient(135deg, ${colors.placeholderBg} 0 10px, ${colors.placeholderBgAlt} 10px 20px)`,
            display: 'grid', placeItems: 'center', font: `400 18px ${fontMono}`, color: colors.placeholderText, textAlign: 'center',
          }}
        >
          zdjęcie<br />z wydarzenia
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: colors.ink }}>
            {title}
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4, color: colors.textMuted, maxWidth: '24ch' }}>
            {subtitle}
            {subtitle && location && <br />}
            {location}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 56, height: 44, background: colors.navy, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 56, height: 44, background: colors.lime, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 56, height: 44, background: colors.coral, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <LogoSlot logo={logo} variant="light" width={180} height={68} />
          <LogoSlot logo={logo} variant="light" width={180} height={68} />
        </div>
      </div>
    </div>
  )
}
