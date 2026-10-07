import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { resolveScheme } from '../schemes'
import { PhotoGallery } from '../PhotoGallery'
import { withPlaceholders } from '../fallback'
import { getDay, getMonthShort } from '../../utils/formatDate'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { InfoLine } from '../blocks/InfoLine'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import type { PosterProps } from '../../types'

// Szerokość zdjęcia wewnątrz bezpiecznej kolumny; na okładce strony zdjęcie
// dodatkowo wychodzi na lewy margines aż do krawędzi.
const PHOTO_W = 360

// GOŚĆ (baner) — zdjęcie na całą wysokość po lewej, tekst po prawej.
export function BannerGosc({ data, scheme, accent, lang }: PosterProps) {
  const { title, speaker, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, photos, hidden, fx, titleScale } = withPlaceholders(data)
  const s = resolveScheme('gosc', scheme, accent)
  const { padX, padY, height } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  const textColor = 'var(--accent)'
  // Trójkąt z sygnetem rośnie razem z marginesem, żeby sygnet został
  // w bezpiecznej kolumnie, a nie w przycinanym rogu.
  const bleed = padX - BANNER_PAD
  const triW = 300 + bleed
  const triH = Math.min(height, Math.round(300 + bleed * 1.45))
  const showDate = !hidden('event_date') || !hidden('event_time')

  return (
    <PosterFrame vars={s.cssVars} style={{ flexDirection: 'row' }}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie prelegenta</>}
        style={{ width: bleed + PHOTO_W + BANNER_PAD, height: '100%', flex: '0 0 auto' }}
        placeholderStyle={{ paddingLeft: bleed }}
        labelStyle={{ fontSize: 18 }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: triW, height: triH, background: 'var(--sygnet-bg, var(--accent))', clipPath: 'polygon(0 0,100% 0,0 100%)', display: 'flex', alignItems: 'flex-start', padding: `${padY}px 0 0 ${padX}px`, boxSizing: 'border-box' }}>
          <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        </div>
      </PhotoGallery>

      <div style={{ flex: 1, minWidth: 0, padding: `${padY}px ${padX}px ${padY}px ${BANNER_PAD}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <Badge color={textColor} style={{ fontSize: 18, paddingTop: 6, ...fx('badge') }}>{badge || (lang === 'en' ? 'SKNM SEMINAR' : 'SEMINARIUM SKNM')}</Badge>
          {showDate && (
            <div style={{ background: 'var(--date-bg)', color: 'var(--date-text)', padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', marginLeft: 'auto' }}>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 0.9, ...fx('event_date') }}>{getDay(event_date)}</div>
              <div style={{ font: `700 18px ${fontMono}`, letterSpacing: '.12em' }}>
                <span style={fx('event_date')}>{getMonthShort(event_date, { upperCase: true, lang })}</span>
                {event_time && !hidden('event_time') && <> <span>{event_time}</span></>}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 58 * titleScale, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-.03em', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          <InfoLine
            parts={[{ text: speaker, hidden: hidden('speaker') }]}
            secondLine={location}
            secondLineHidden={hidden('location')}
            style={{ fontSize: 26, color: 'var(--muted-text)', lineHeight: 1.35 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: textColor, paddingBottom: 6 }}>{lang === 'en' ? 'Free entry · sknm.pk.edu.pl' : 'Wstęp wolny · sknm.pk.edu.pl'}</div>
          <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
        </div>
      </div>
    </PosterFrame>
  )
}
