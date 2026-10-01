import { fontMono, QR_SLOT_H } from './theme'
import { sygnetByName } from './logos'
import { resolveScheme } from './schemes'
import { LogoSlots } from './blocks/LogoSlots'
import { QrSlot } from './blocks/QrSlot'
import { PhotoGallery } from './PhotoGallery'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { InfoLine } from './blocks/InfoLine'
import { LogoRow } from './blocks/LogoRow'
import type { PosterProps } from '../types'

// GOŚĆ — zdjęcie + pas
export function PosterGosc({ data, scheme, accent, lang }: PosterProps) {
  const { title, speaker, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, photos, hidden, fx, titleScale } = withPlaceholders(data)
  const s = resolveScheme('gosc', scheme, accent)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  const boxBg = 'var(--date-bg)'
  const boxText = 'var(--date-text)'
  const textColor = 'var(--accent)'

  return (
    <PosterFrame vars={s.cssVars}>
      <PhotoGallery photos={photos.photo} label={<>zdjęcie prelegenta<br />1080 × 600</>} style={{ height: 600 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 420, height: 420, background: 'var(--sygnet-bg, var(--accent))', clipPath: 'polygon(0 0,100% 0,0 100%)', display: 'flex', alignItems: 'flex-start', padding: '72px 0 0 72px', boxSizing: 'border-box' }}>
          <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block' }} />
        </div>
      </PhotoGallery>

      <div style={{ flex: 1, padding: '56px 72px 72px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        {(!hidden('event_date') || !hidden('event_time')) && (
          <div style={{ position: 'absolute', top: -56, right: 72, background: boxBg, color: boxText, padding: '18px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 0.9, ...fx('event_date') }}>{getDay(event_date)}</div>
            <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.12em' }}>
              <span style={fx('event_date')}>{getMonthShort(event_date, { upperCase: true, lang })}</span>
              {event_time && !hidden('event_time') && <> <span>{event_time}</span></>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
          <Badge color={textColor} style={fx('badge')}>{badge || (lang === 'en' ? 'SKNM SEMINAR' : 'SEMINARIUM SKNM')}</Badge>
          <div style={{ fontSize: 82 * titleScale, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-.03em', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          <InfoLine
            parts={[{ text: speaker, hidden: hidden('speaker') }]}
            secondLine={location}
            secondLineHidden={hidden('location')}
            style={{ fontSize: 32, color: 'var(--muted-text)', lineHeight: 1.35 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: textColor }}>{lang === 'en' ? 'Free entry · sknm.pk.edu.pl' : 'Wstęp wolny · sknm.pk.edu.pl'}</div>
          <LogoRow minHeight={QR_SLOT_H}>
            <QrSlot value={qrUrl} />
            <LogoSlots slots={slots} variant={s.logoVariant} />
          </LogoRow>
        </div>
      </div>
    </PosterFrame>
  )
}
