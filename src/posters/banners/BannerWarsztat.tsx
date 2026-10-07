import type { CSSProperties, ReactNode } from 'react'
import { sygnetByName } from '../logos'
import { PhotoGallery } from '../PhotoGallery'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { getDay, getMonthShort } from '../../utils/formatDate'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import type { PosterProps } from '../../types'

// Zdjęcie: tyle wchodzi w bezpieczną kolumnę (reszta to prawy margines),
// a `SLANT` to poziomy bieg skosu lewej krawędzi.
const PHOTO_W = 440
const SLANT = 170

function Pill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: 'var(--pill-fill)', color: 'var(--pill-text)', fontSize: 22, fontWeight: 700, padding: '9px 15px', ...style }}>
      {children}
    </div>
  )
}

// WARSZTAT (baner) — skośne zdjęcie przy prawej krawędzi, tekst po lewej.
export function BannerWarsztat({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, photos, fx, titleScale, textScale } = withPlaceholders(data)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  const pills = [
    { text: event_time, style: fx('event_time') },
    { text: `${getDay(event_date)} ${getMonthShort(event_date, { lang })}`, style: fx('event_date') },
    { text: location, style: fx('location') },
  ]
  const s = resolveScheme('warsztat', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={s.cssVars}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie<br />z warsztatów</>}
        style={{ position: 'absolute', top: 0, right: 0, width: padX + PHOTO_W, height: '100%', clipPath: `polygon(${SLANT}px 0,100% 0,100% 100%,0 100%)` }}
        placeholderStyle={{ paddingLeft: SLANT / 2 }}
        labelStyle={{ fontSize: 18 }}
      />

      <div style={{ position: 'absolute', inset: `${padY}px ${padX}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 620 }}>
          <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ fontSize: 18, padding: '8px 14px', ...fx('badge') }}>{badge || (lang === 'en' ? 'WORKSHOP' : 'WARSZTATY')}</Badge>
          <div style={{ fontSize: 60 * titleScale, fontWeight: 800, lineHeight: 0.96, letterSpacing: '-.035em', color: 'var(--title)', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 24 * textScale, fontWeight: 500, lineHeight: 1.35, color: 'var(--muted-text)', ...fx('subtitle') }}>{subtitle}</div>
          )}
        </div>

        {/* Pigułki i stopka w jednym rzędzie: logo leży na zdjęciu, więc slot
            dostaje tło `slot-bg`, jak w wersji kwadratowej. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 620, flex: '0 1 auto' }}>
            {pills.map((p, i) => <Pill key={i} style={p.style}>{p.text}</Pill>)}
          </div>
          <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} slotStyle={{ background: 'var(--slot-bg)' }} />
        </div>
      </div>
    </PosterFrame>
  )
}
