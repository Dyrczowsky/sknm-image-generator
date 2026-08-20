import { colors, fontMono, posterBaseStyle } from './theme'
import { sygnetGranat } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'

// 1f · REKRUTACJA — wzór z sygnetu
export function Poster1f({ data }) {
  const { title, subtitle, event_date, event_time, location, logo } = withPlaceholders(data)

  const infoLine = [`${getDay(event_date)} ${getMonthShort(event_date)}`, event_time, location].join(' · ')

  return (
    <div style={{ ...posterBaseStyle, background: colors.lime, color: colors.limeText, padding: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 340, background: colors.navy,
          clipPath: 'polygon(0 42%,8.33% 0,16.66% 42%,25% 0,33.33% 42%,41.66% 0,50% 42%,58.33% 0,66.66% 42%,75% 0,83.33% 42%,91.66% 0,100% 42%,100% 100%,0 100%)',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <img src={sygnetGranat} alt="SKNM" style={{ width: 140, display: 'block' }} />
        <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.16em', textAlign: 'right', lineHeight: 1.7 }}>
          STUDENCKIE KOŁO<br />NAUKOWE MATEMATYKÓW<br />POLITECHNIKI KRAKOWSKIEJ
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, position: 'relative', maxWidth: 900 }}>
        <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 0.88, letterSpacing: '-.045em' }}>
          {title}
        </div>
        <div style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.3, color: colors.navyDark }}>
          {subtitle || 'Seminaria, konkursy, wyjazdy i własne projekty badawcze. Każdy rok studiów, każdy wydział.'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', color: colors.cream }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
          <div style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em', color: colors.lime }}>SPOTKANIE ORGANIZACYJNE</div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.05 }}>{infoLine}</div>
          <div style={{ fontSize: 26, fontWeight: 500, opacity: 0.85 }}>sknm.pk.edu.pl · @sknm.pk</div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <PlaceholderBox label="kod QR" width={170} height={170} style={{ borderColor: 'rgba(244,242,237,.55)', color: 'rgba(244,242,237,.75)' }} />
          <LogoSlot logo={logo} variant="dark" width={180} height={68} />
        </div>
      </div>
    </div>
  )
}
