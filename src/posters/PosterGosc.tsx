import type { PosterProps } from '../types'
import { getDay, getMonthShort } from '../utils/formatDate'
import { DEFAULT_BADGE, FREE_ENTRY } from './copy'
import { PLACEHOLDERS, withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { fontMono, leading, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { FooterLogos } from './blocks/FooterLogos'
import { InfoLine } from './blocks/InfoLine'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterText } from './blocks/PosterText'
import { Sygnet } from './blocks/Sygnet'
import { PhotoGallery } from './PhotoGallery'

// GOŚĆ — zdjęcie + pas
export function PosterGosc({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, event_date, event_time, logoSlots, qrUrl, photos, hidden, fx, titleScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('gosc', scheme, accent)

  const { shape, height } = usePosterShape()
  // Poziom: zdjęcie obok tekstu zamiast nad nim - pas 1528×600 zostawiałby
  // na tekst za mało wysokości.
  const side = shape === 'landscape'
  const photoH = Math.round((height * 600) / 1080)
  const showDate = !hidden('event_date') || !hidden('event_time')
  const dateBox = showDate && (
    <div
      style={{
        background: 'var(--date-bg)', color: 'var(--date-text)', padding: '18px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        ...(side ? { alignSelf: 'flex-end' } : { position: 'absolute', top: -56, right: 72 }),
      }}
    >
      <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 0.9, ...fx('event_date') }}>{getDay(event_date)}</div>
      <div style={{ font: `700 22px ${fontMono}`, letterSpacing: '.12em' }}>
        <span style={fx('event_date')}>{getMonthShort(event_date, { upperCase: true, lang })}</span>
        {event_time && !hidden('event_time') && <> <span>{event_time}</span></>}
      </div>
    </div>
  )

  return (
    <PosterFrame vars={cssVars} style={side ? { flexDirection: 'row' } : undefined}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie prelegenta<br />{side ? '640 × 1080' : `1080 × ${photoH}`}</>}
        style={side ? { width: 640, height: '100%', flex: '0 0 auto' } : { height: photoH }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: 420, height: 420, background: 'var(--sygnet-bg, var(--accent))', clipPath: 'polygon(0 0,100% 0,0 100%)', display: 'flex', alignItems: 'flex-start', padding: '72px 0 0 72px', boxSizing: 'border-box' }}>
          <Sygnet name={sygnet} />
        </div>
      </PhotoGallery>

      <div style={{ flex: 1, padding: side ? 72 : '56px 72px 72px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        {dateBox}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
          <Badge color="var(--accent)" style={fx('badge')} field={{ path: 'badge', value: raw.badge, fallback: DEFAULT_BADGE.seminarium[lang], label: 'Etykieta' }} />
          <PosterText
            path="title"
            value={raw.title}
            fallback={PLACEHOLDERS.title}
            multiline
            label="Tytuł"
            style={{ fontSize: 82 * titleScale, fontWeight: 800, lineHeight: leading(0.98, titleScale), letterSpacing: TITLE_TRACKING, fontKerning: 'none', whiteSpace: 'pre-line', ...fx('title') }}
          />
          <InfoLine
            parts={[{ field: { path: 'speaker', value: raw.speaker, fallback: PLACEHOLDERS.speaker, label: 'Prelegent / organizator' }, hidden: hidden('speaker') }]}
            secondLine={{ path: 'location', value: raw.location, fallback: PLACEHOLDERS.location, label: 'Lokalizacja' }}
            secondLineHidden={hidden('location')}
            style={{ fontSize: 32, color: 'var(--muted-text)', lineHeight: 1.35 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <PosterText
            path="badge2"
            value={raw.badge2}
            fallback={FREE_ENTRY[lang]}
            label="Linia na dole"
            style={{ fontSize: 22, fontWeight: 600, color: 'var(--accent)', ...fx('badge2') }}
          />
          <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
        </div>
      </div>
    </PosterFrame>
  )
}
