import { colors, fontMono, LOGO_CLEAR } from './theme'
import { sygnetByName } from './logos'
import { resolveScheme } from './schemes'
import { LogoSlots } from './blocks/LogoSlots'
import { QrSlot } from './blocks/QrSlot'
import { withPlaceholders } from './fallback'
import { formatFullDate } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { LogoRow } from './blocks/LogoRow'
import type { ListItem, PosterProps } from '../types'

const DEFAULT_AGENDA: ListItem[] = [
  { time: '09:30', title: 'Otwarcie i wykład plenarny', subtitle: 'prof. dr hab. Jan Nowak' },
  { time: '11:00', title: 'Sesja studencka I', subtitle: 'analiza numeryczna, optymalizacja' },
  { time: '13:00', title: 'Sesja studencka II', subtitle: 'statystyka, uczenie maszynowe' },
]

// KONFERENCJA — nagłówek + lista programu
export function PosterKonferencja({ data, scheme }: PosterProps) {
  const { title, event_date, location, badge, badge2, graphics, showPkLogo, qrUrl, lists, hidden, fx } = withPlaceholders(data)
  const agenda = lists.agenda?.length ? lists.agenda : DEFAULT_AGENDA
  const s = resolveScheme('konferencja', scheme)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars}>
      <div style={{ background: 'var(--panel)', color: 'var(--panel-text)', padding: '56px 72px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge color="var(--header-badge)" style={fx('badge')}>{badge || 'SEMINARIUM SKNM'}</Badge>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 0.96, letterSpacing: '-.03em', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            <span style={fx('event_date')}>{formatFullDate(event_date)}</span>
            {!hidden('event_date') && !hidden('location') && <span>{' · '}</span>}
            <span style={fx('location')}>{location}</span>
          </div>
        </div>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block', flex: '0 0 auto', alignSelf: 'flex-start' }} />
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
                borderTop: `2px solid ${i === 0 ? 'var(--line-first)' : 'var(--line-rest)'}`,
                alignItems: 'baseline',
              }}
            >
              <div style={{ font: `700 26px ${fontMono}`, color: colors.coral }}>{item.time}</div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.15, fontKerning: 'none' }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{ fontSize: 26, fontWeight: 500, color: 'var(--muted-text)' }}>{item.subtitle}</div>
                )}
              </div>
            </div>
          ))}
          <div style={{ borderTop: `2px solid var(--line-rest)` }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Badge color="var(--footer-badge)" style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', ...fx('badge2') }}>{badge2 || 'WIĘCEJ INFORMACJI'}</Badge>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--muted-text)' }}>sknm.pk.edu.pl</div>
          </div>
          <LogoRow gap={LOGO_CLEAR} alignItems="center">
            <QrSlot value={qrUrl} />
            <LogoSlots slots={slots} variant={s.logoVariant} />
          </LogoRow>
        </div>
      </div>
    </PosterFrame>
  )
}
