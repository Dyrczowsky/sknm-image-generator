import { colors, fontMono } from './theme'
import { sygnetGranat } from './logos'
import { LogoSlot } from './LogoSlot'
import { PhotoGallery } from './PhotoGallery'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { BrandingText } from './blocks/BrandingText'
import { InfoLine } from './blocks/InfoLine'
import { LogoRow } from './blocks/LogoRow'

// 1d · DATA — liczba jako grafika
export function Poster1d({ data }) {
  const { title, subtitle, event_date, event_time, location, logos, photos } = withPlaceholders(data)

  return (
    <PosterFrame background={colors.cream} color={colors.navy} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <BrandingText lines={['WYDARZENIE', 'SKNM · PK']} style={{ textAlign: 'left' }} />
        <img src={sygnetGranat} alt="SKNM" style={{ width: 132, display: 'block' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '-40px 0' }}>
        <div style={{ fontSize: 520, fontWeight: 800, lineHeight: 0.72, letterSpacing: '-.06em' }}>
          {getDay(event_date)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 28, paddingTop: 40 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.9, color: colors.coral, letterSpacing: '-.03em' }}>
            {getMonthShort(event_date, { upperCase: true })}
          </div>
          <div style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em' }}>{event_time}</div>
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
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: colors.ink, fontKerning: 'none' }}>
            {title}
          </div>
          <InfoLine parts={[subtitle]} secondLine={location} style={{ color: colors.textMuted, maxWidth: '24ch' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 56, height: 44, background: colors.navy, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 56, height: 44, background: colors.lime, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 56, height: 44, background: colors.coral, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <LogoRow gap={14}>
          <LogoSlot logo={logos.pk} variant="light" width={180} height={68} />
          <LogoSlot logo={logos.faculty} variant="light" width={180} height={68} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
