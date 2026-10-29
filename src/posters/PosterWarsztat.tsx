import { toPlain } from '../richText'
import type { PosterProps } from '../types'
import { getDay, getMonthShort } from '../utils/formatDate'
import { DEFAULT_BADGE } from './copy'
import { PLACEHOLDERS, withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { leading, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { FooterLogos } from './blocks/FooterLogos'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterText } from './blocks/PosterText'
import { Sygnet } from './blocks/Sygnet'
import { PhotoGallery } from './PhotoGallery'

// WARSZTAT — skos
export function PosterWarsztat({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, event_date, event_time, logoSlots, qrUrl, photos, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('warsztat', scheme, accent)
  const { kx } = usePosterShape()

  const pills = [
    { text: event_time, style: fx('event_time') },
    { text: `${getDay(event_date)} ${getMonthShort(event_date, { lang })}`, style: fx('event_date') },
    { field: { path: 'location', value: raw.location, fallback: PLACEHOLDERS.location, label: 'Lokalizacja' }, style: fx('location') },
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
          <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ padding: '10px 16px', ...fx('badge') }} field={{ path: 'badge', value: raw.badge, fallback: DEFAULT_BADGE.warsztat[lang], label: 'Etykieta' }} />
          <PosterText
            path="title"
            value={raw.title}
            fallback={PLACEHOLDERS.title}
            multiline
            label="Tytuł"
            style={{ fontSize: 104 * titleScale, fontWeight: 800, lineHeight: leading(0.94, titleScale), letterSpacing: TITLE_TRACKING, color: 'var(--title)', fontKerning: 'none', whiteSpace: 'pre-line', ...fx('title') }}
          />
          {toPlain(raw.subtitle ?? '') !== '' && (
            <PosterText
              path="subtitle"
              value={raw.subtitle}
              multiline
              label="Opis / podtytuł"
              style={{ fontSize: 32 * textScale, fontWeight: 500, lineHeight: leading(1.4, textScale), color: 'var(--muted-text)', whiteSpace: 'pre-line', ...fx('subtitle') }}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {pills.map((pill, i) => {
              const style = { background: 'var(--pill-fill)', color: 'var(--pill-text)', fontSize: 28, fontWeight: 700, padding: '12px 20px', ...pill.style }
              return pill.field ? (
                <PosterText key={i} style={style} inline {...pill.field} />
              ) : (
                <div key={i} style={style}>
                  {pill.text}
                </div>
              )
            })}
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
