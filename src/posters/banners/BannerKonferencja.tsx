import { colors, fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { resolveScheme } from '../schemes'
import { withPlaceholders } from '../fallback'
import { formatFullDate } from '../../utils/formatDate'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import type { ListItem, PosterProps } from '../../types'

const DEFAULT_AGENDA: ListItem[] = [
  { time: '09:30', title: 'Otwarcie i wykład plenarny', subtitle: 'prof. dr hab. Jan Nowak' },
  { time: '11:00', title: 'Sesja studencka I', subtitle: 'analiza numeryczna, optymalizacja' },
  { time: '13:00', title: 'Sesja studencka II', subtitle: 'statystyka, uczenie maszynowe' },
]

// Baner mieści tylko początek programu - dalsze punkty są pomijane.
const MAX_ROWS = 4
// Szerokość panelu nagłówka wewnątrz bezpiecznej kolumny.
const PANEL_W = 470

// KONFERENCJA (baner) — panel nagłówka po lewej, początek programu po prawej.
export function BannerKonferencja({ data, scheme, accent, lang }: PosterProps) {
  const { title, event_date, location, badge, badge2, graphics, showPkLogo, qrUrl, lists, hidden, fx, titleScale } = withPlaceholders(data)
  const agenda = (lists.agenda?.length ? lists.agenda : DEFAULT_AGENDA).slice(0, MAX_ROWS)
  const s = resolveScheme('konferencja', scheme, accent)
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ flexDirection: 'row' }}>
      <div style={{ flex: '0 0 auto', width: padX + PANEL_W, boxSizing: 'border-box', background: 'var(--panel)', color: 'var(--panel-text)', padding: `${padY}px 40px ${padY}px ${padX}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Badge color="var(--header-badge)" style={{ fontSize: 18, ...fx('badge') }}>{badge || (lang === 'en' ? 'SKNM SEMINAR' : 'SEMINARIUM SKNM')}</Badge>
          <div style={{ fontSize: 50 * titleScale, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-.03em', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>
            <span style={fx('event_date')}>{formatFullDate(event_date, lang)}</span>
            {!hidden('event_date') && !hidden('location') && <span>{' · '}</span>}
            <span style={fx('location')}>{location}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: `${padY}px ${padX}px ${padY}px 40px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {agenda.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '96px 1fr',
                gap: 18,
                padding: '12px 0',
                borderTop: `2px solid ${i === 0 ? 'var(--line-first)' : 'var(--line-rest)'}`,
                alignItems: 'baseline',
              }}
            >
              <div style={{ font: `700 20px ${fontMono}`, color: colors.coral }}>{item.time}</div>
              <div>
                <div style={{ fontSize: 27, fontWeight: 700, lineHeight: 1.15, fontKerning: 'none' }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--muted-text)' }}>{item.subtitle}</div>
                )}
              </div>
            </div>
          ))}
          <div style={{ borderTop: `2px solid var(--line-rest)` }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flex: '0 0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 4 }}>
            <Badge color="var(--footer-badge)" style={{ font: `700 16px ${fontMono}`, letterSpacing: '.12em', ...fx('badge2') }}>{badge2 || (lang === 'en' ? 'MORE INFORMATION' : 'WIĘCEJ INFORMACJI')}</Badge>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--muted-text)' }}>sknm.pk.edu.pl</div>
          </div>
          <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
        </div>
      </div>
    </PosterFrame>
  )
}
