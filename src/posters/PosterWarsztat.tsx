import type { PosterProps } from '../types'
import { getDay, getMonthShort } from '../utils/formatDate'
import { DEFAULT_BADGE } from './copy'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { FooterLogos } from './blocks/FooterLogos'
import { PosterFrame } from './blocks/PosterFrame'
import { Sygnet } from './blocks/Sygnet'
import { PhotoGallery } from './PhotoGallery'

// WARSZTAT — skos
export function PosterWarsztat({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, logoSlots, qrUrl, photos, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('warsztat', scheme, accent)
  const { kx } = usePosterShape()

  const pills = [
    { text: event_time, style: fx('event_time') },
    { text: `${getDay(event_date)} ${getMonthShort(event_date, { lang })}`, style: fx('event_date') },
    { text: location, style: fx('location') },
  ]

  return (
    <PosterFrame vars={cssVars}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie<br />z warsztatów</>}
        style={{ position: 'absolute', top: 0, right: 0, width: 660 * kx, height: '100%', clipPath: 'polygon(38% 0,100% 0,100% 100%,0 100%)' }}
        placeholderStyle={{ paddingLeft: 180 * kx }}
      />

      <div style={{ position: 'absolute', inset: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Sygnet name={sygnet} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 600 }}>
          <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ padding: '10px 16px', ...fx('badge') }}>{badge || DEFAULT_BADGE.warsztat[lang]}</Badge>
          <div style={{ fontSize: 104 * titleScale, fontWeight: 800, lineHeight: 0.94, letterSpacing: TITLE_TRACKING, color: 'var(--title)', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 32 * textScale, fontWeight: 500, lineHeight: 1.4, color: 'var(--muted-text)', ...fx('subtitle') }}>{subtitle}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {pills.map((pill, i) => (
              <div key={i} style={{ background: 'var(--pill-fill)', color: 'var(--pill-text)', fontSize: 28, fontWeight: 700, padding: '12px 20px', ...pill.style }}>
                {pill.text}
              </div>
            ))}
          </div>
          {/* Stopka jak w pozostałych szablonach: QR maksymalnie w lewo, logo
              w prawym dolnym rogu. Logo leży na zdjęciu, więc każdy slot
              dostaje tło `slot-bg` - czytelną kartę pod znakiem. */}
          <div style={{ display: 'flex' }}>
            <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} slotStyle={{ background: 'var(--slot-bg)' }} />
          </div>
        </div>
      </div>
    </PosterFrame>
  )
}
