import { colors } from './theme'
import { sygnetGranat } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { PhotoGallery } from './PhotoGallery'
import { withPlaceholders } from './fallback'
import { getDay, getMonthShort } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { LogoRow } from './blocks/LogoRow'

function Pill({ children }) {
  return (
    <div style={{ background: colors.lime, color: colors.limeText, fontSize: 28, fontWeight: 700, padding: '12px 20px' }}>
      {children}
    </div>
  )
}

// 1c · WARSZTAT — skos
export function Poster1c({ data }) {
  const { title, subtitle, event_date, event_time, location, logos, photos } = withPlaceholders(data)

  const pills = [event_time, `${getDay(event_date)} ${getMonthShort(event_date)}`, location]

  return (
    <PosterFrame background={colors.cream} color={colors.ink}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie<br />z warsztatów</>}
        style={{ position: 'absolute', top: 0, right: 0, width: 660, height: 1080, clipPath: 'polygon(38% 0,100% 0,100% 100%,0 100%)' }}
        placeholderStyle={{ paddingLeft: 180 }}
      />

      <div style={{ position: 'absolute', inset: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <img src={sygnetGranat} alt="SKNM" style={{ width: 120, display: 'block' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 600 }}>
          <Badge background={colors.navy} color={colors.lime} style={{ padding: '10px 16px' }}>WARSZTATY</Badge>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em', color: colors.navy }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.4, color: colors.textMuted }}>{subtitle}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {pills.map((p, i) => <Pill key={i}>{p}</Pill>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
            <PlaceholderBox label={<>kod QR<br />zapisy</>} width={150} height={150} style={{ background: colors.cream }} />
            <LogoRow gap={14}>
              <LogoSlot logo={logos.pk} variant="light" width={170} height={66} style={{ background: colors.cream }} />
              <LogoSlot logo={logos.faculty} variant="light" width={170} height={66} style={{ background: colors.cream }} />
            </LogoRow>
          </div>
        </div>
      </div>
    </PosterFrame>
  )
}
