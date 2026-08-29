import { sygnetByName } from './logos'
import { PlaceholderBox } from './PlaceholderBox'
import { LogoSlot } from './LogoSlot'
import { PhotoGallery } from './PhotoGallery'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { getDay, getMonthShort } from '../utils/formatDate'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { LogoRow } from './blocks/LogoRow'
import type { ReactNode } from 'react'
import type { PosterProps } from '../types'

function Pill({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: 'var(--pill-fill)', color: 'var(--pill-text)', fontSize: 28, fontWeight: 700, padding: '12px 20px' }}>
      {children}
    </div>
  )
}

// WARSZTAT — skos
export function PosterWarsztat({ data, scheme }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, logos, photos } = withPlaceholders(data)

  const pills = [event_time, `${getDay(event_date)} ${getMonthShort(event_date)}`, location]
  const s = resolveScheme('warsztat', scheme)

  return (
    <PosterFrame vars={s.cssVars}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie<br />z warsztatów</>}
        style={{ position: 'absolute', top: 0, right: 0, width: 660, height: 1080, clipPath: 'polygon(38% 0,100% 0,100% 100%,0 100%)' }}
        placeholderStyle={{ paddingLeft: 180 }}
      />

      <div style={{ position: 'absolute', inset: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 600 }}>
          <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ padding: '10px 16px' }}>{badge || 'WARSZTATY'}</Badge>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.94, letterSpacing: '-.035em', color: 'var(--title)', fontKerning: 'none' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.4, color: 'var(--muted-text)' }}>{subtitle}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {pills.map((p, i) => <Pill key={i}>{p}</Pill>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
            <PlaceholderBox label={<>kod QR<br />zapisy</>} width={150} height={150} style={{ background: 'var(--slot-bg)', borderColor: 'var(--qr-border)', color: 'var(--qr-text)' }} />
            <LogoRow gap={14}>
              <LogoSlot logo={logos.pk} variant={s.logoVariant} width={170} height={66} style={{ background: 'var(--slot-bg)' }} />
              <LogoSlot logo={logos.faculty} variant={s.logoVariant} width={170} height={66} style={{ background: 'var(--slot-bg)' }} />
            </LogoRow>
          </div>
        </div>
      </div>
    </PosterFrame>
  )
}
