import { colors, fontMono } from './theme'
import { sygnetByName } from './logos'
import { resolveScheme } from './schemes'
import { LogoSlot } from './LogoSlot'
import { PhotoGallery } from './PhotoGallery'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { BrandingText } from './blocks/BrandingText'
import { InfoLine } from './blocks/InfoLine'
import { LogoRow } from './blocks/LogoRow'
import type { PosterProps } from '../types'

// DATA — liczba jako grafika
export function PosterData({ data, scheme }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, logos, photos, hidden, fx } = withPlaceholders(data)
  const s = resolveScheme('data', scheme)

  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <BrandingText lines={['WYDARZENIE', 'SKNM · PK']} style={{ textAlign: 'left' }} />
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '-40px 0' }}>
        <div style={{ fontSize: 520, fontWeight: 800, lineHeight: 0.72, letterSpacing: '-.06em', ...fx('event_date') }}>
          {getDay(event_date)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 28, paddingTop: 40 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.9, color: colors.coral, letterSpacing: '-.03em', ...fx('event_date') }}>
            {getMonthShort(event_date, { upperCase: true })}
          </div>
          <div style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em', ...fx('event_time') }}>{event_time}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
        <PhotoGallery
          photos={photos.photo}
          label={<>zdjęcie<br />z wydarzenia</>}
          style={{ width: 230, height: 230, flex: '0 0 auto', borderRadius: 999 }}
          labelStyle={{ font: `400 18px ${fontMono}` }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: 'var(--title)', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          <InfoLine
            parts={[{ text: subtitle, hidden: hidden('subtitle') }]}
            secondLine={location}
            secondLineHidden={hidden('location')}
            style={{ color: 'var(--muted-text)', maxWidth: '24ch' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 56, height: 44, background: 'var(--tri1)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 56, height: 44, background: 'var(--tri2)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 56, height: 44, background: 'var(--tri3)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <LogoRow gap={14}>
          <LogoSlot logo={logos.pk} variant={s.logoVariant} />
          <LogoSlot logo={logos.faculty} variant={s.logoVariant} fallback={false} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
