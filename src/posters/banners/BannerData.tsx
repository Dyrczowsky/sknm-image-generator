import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { resolveScheme } from '../schemes'
import { PhotoGallery } from '../PhotoGallery'
import { withPlaceholders } from '../fallback'
import { getDay, getMonthShort } from '../../utils/formatDate'
import { PosterFrame } from '../blocks/PosterFrame'
import { BrandingText } from '../blocks/BrandingText'
import { InfoLine } from '../blocks/InfoLine'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import type { PosterProps } from '../../types'

// DATA (baner) — wielka liczba dnia po lewej, tytuł i zdjęcie po prawej.
export function BannerData({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, graphics, showPkLogo, qrUrl, photos, hidden, fx, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('data', scheme, accent)
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <BrandingText lines={lang === 'en' ? ['EVENT', 'SKNM · PK'] : ['WYDARZENIE', 'SKNM · PK']} style={{ textAlign: 'left', fontSize: 18 }} />
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 36, margin: '-36px 0 -8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
          <div style={{ fontSize: 330, fontWeight: 800, lineHeight: 0.76, letterSpacing: '-.06em', ...fx('event_date') }}>
            {getDay(event_date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 22, paddingTop: 24 }}>
            <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 0.9, color: 'var(--month-color)', letterSpacing: '-.03em', ...fx('event_date') }}>
              {getMonthShort(event_date, { upperCase: true, lang })}
            </div>
            <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.1em', ...fx('event_time') }}>{event_time}</div>
          </div>
        </div>

        <PhotoGallery
          photos={photos.photo}
          label={<>zdjęcie<br />z wydarzenia</>}
          style={{ width: 150, height: 150, flex: '0 0 auto', borderRadius: 999 }}
          labelStyle={{ font: `400 13px ${fontMono}` }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 48 * titleScale, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: 'var(--title)', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          <InfoLine
            parts={[{ text: subtitle, hidden: hidden('subtitle') }]}
            partsStyle={{ fontSize: 22 * textScale }}
            secondLine={location}
            secondLineHidden={hidden('location')}
            style={{ fontSize: 22, color: 'var(--muted-text)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ width: 40, height: 32, background: 'var(--tri1)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 40, height: 32, background: 'var(--tri2)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 40, height: 32, background: 'var(--tri3)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
