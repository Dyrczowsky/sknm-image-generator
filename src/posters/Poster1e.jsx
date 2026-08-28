import { colors, fontMono } from './theme'
import { sygnetNegatywny } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { withPlaceholders } from './fallback'
import { formatFullDate } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { LogoRow } from './blocks/LogoRow'

const DEFAULT_AGENDA = [
  { time: '09:30', title: 'Otwarcie i wykład plenarny', subtitle: 'prof. dr hab. Jan Nowak' },
  { time: '11:00', title: 'Sesja studencka I', subtitle: 'analiza numeryczna, optymalizacja' },
  { time: '13:00', title: 'Sesja studencka II', subtitle: 'statystyka, uczenie maszynowe' },
]

// 1e · KONFERENCJA — nagłówek + lista programu
export function Poster1e({ data }) {
  const { title, event_date, location, badge, badge2, logos, lists } = withPlaceholders(data)
  const agenda = lists.agenda?.length ? lists.agenda : DEFAULT_AGENDA

  const dateLine = `${formatFullDate(event_date)} · ${location}`

  return (
    <PosterFrame background={colors.cream} color={colors.ink}>
      <div style={{ background: colors.navy, color: colors.cream, padding: '56px 72px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge color={colors.lime}>{badge || 'SEMINARIUM SKNM'}</Badge>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 0.96, letterSpacing: '-.03em', fontKerning: 'none' }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{dateLine}</div>
        </div>
        <img src={sygnetNegatywny} alt="SKNM" style={{ width: 132, display: 'block', flex: '0 0 auto' }} />
      </div>

      <div style={{ flex: 1, padding: '48px 72px 72px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {agenda.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: 24,
                padding: '22px 0',
                borderTop: `2px solid ${i === 0 ? colors.navy : colors.creamMuted}`,
                alignItems: 'baseline',
              }}
            >
              <div style={{ font: `700 26px ${fontMono}`, color: colors.coral }}>{item.time}</div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.15, fontKerning: 'none' }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{ fontSize: 26, fontWeight: 500, color: colors.textMuted }}>{item.subtitle}</div>
                )}
              </div>
            </div>
          ))}
          <div style={{ borderTop: `2px solid ${colors.creamMuted}` }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Badge color={colors.navy} style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em' }}>{badge2 || 'WIĘCEJ INFORMACJI'}</Badge>
            <div style={{ fontSize: 24, fontWeight: 600, color: colors.textMuted }}>sknm.pk.edu.pl</div>
          </div>
          <LogoRow gap={14}>
            <LogoSlot logo={logos.pk} variant="light" width={180} height={68} />
            <PlaceholderBox label="patronat" width={180} height={68} />
          </LogoRow>
        </div>
      </div>
    </PosterFrame>
  )
}
