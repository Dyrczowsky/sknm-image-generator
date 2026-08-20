import { colors, fontMono } from './theme'
import { sygnetNegatywny } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { formatFullDate } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { LogoRow } from './blocks/LogoRow'

// 1e · KONFERENCJA — nagłówek + pojedynczy punkt programu
export function Poster1e({ data }) {
  const { title, subtitle, speaker, event_date, event_time, location, logo } = withPlaceholders(data)

  const dateLine = `${formatFullDate(event_date)} · ${location}`

  return (
    <PosterFrame background={colors.cream} color={colors.ink}>
      <div style={{ background: colors.navy, color: colors.cream, padding: '56px 72px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge color={colors.lime}>SEMINARIUM SKNM</Badge>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 0.96, letterSpacing: '-.03em' }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{dateLine}</div>
        </div>
        <img src={sygnetNegatywny} alt="SKNM" style={{ width: 128, display: 'block', flex: '0 0 auto' }} />
      </div>

      <div style={{ flex: 1, padding: '48px 72px 72px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 24, padding: '22px 0', borderTop: `2px solid ${colors.navy}`, borderBottom: `2px solid ${colors.creamMuted}`, alignItems: 'baseline' }}>
          <div style={{ font: `700 28px ${fontMono}`, color: colors.coral }}>{event_time}</div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.15 }}>{subtitle || 'Program spotkania'}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: colors.textMuted }}>{speaker}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Badge color={colors.navy} style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em' }}>WIĘCEJ INFORMACJI</Badge>
            <div style={{ fontSize: 24, fontWeight: 600, color: colors.textMuted }}>sknm.pk.edu.pl</div>
          </div>
          <LogoRow gap={14}>
            <LogoSlot logo={logo} variant="light" width={180} height={68} />
            <PlaceholderBox label="patronat" width={180} height={68} />
          </LogoRow>
        </div>
      </div>
    </PosterFrame>
  )
}
