import { colors, fontMono, posterBaseStyle } from './theme'
import { sygnetNegatywny } from './logos'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'

// 1a · WYKŁAD — typografia
export function Poster1a({ data }) {
  const { title, subtitle, speaker, event_date, event_time, location, logo } = withPlaceholders(data)

  return (
    <div
      style={{
        ...posterBaseStyle,
        background: colors.navy,
        color: colors.cream,
        padding: 72,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetNegatywny} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.16em', textAlign: 'right', lineHeight: 1.7, opacity: 0.85 }}>
          SKNM<br />POLITECHNIKA<br />KRAKOWSKA
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}>
        <div style={{ alignSelf: 'flex-start', background: colors.lime, color: colors.limeText, font: `700 24px ${fontMono}`, letterSpacing: '.14em', padding: '10px 18px' }}>
          WYKŁAD OTWARTY
        </div>
        <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em' }}>
          {title}
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, color: colors.lime }}>{speaker}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.86, letterSpacing: '-.04em', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
            {getDay(event_date)}
            <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: 0 }}> {getMonthShort(event_date, { upperCase: true })}</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4, paddingBottom: 10 }}>
            {[event_time, location].filter(Boolean).join(' · ')}
            {subtitle && <><br />{subtitle}</>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <LogoSlot logo={logo} variant="dark" width={200} height={76} />
          <LogoSlot logo={logo} variant="dark" width={200} height={76} />
        </div>
      </div>

      <div style={{ position: 'absolute', top: 0, right: 0, width: 700, height: 600, background: 'rgba(255,255,255,.055)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920, height: 780, background: colors.navyLight, opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520, height: 300, background: colors.navyDark, clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
      <div style={{ position: 'absolute', left: 18, top: 392, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 38, height: 32, background: colors.lime, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        <div style={{ width: 38, height: 32, background: colors.lime, clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.66 }} />
        <div style={{ width: 38, height: 32, background: colors.lime, clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.33 }} />
      </div>
    </div>
  )
}
