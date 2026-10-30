import type { PosterProps } from '../types'
import { BRANDING_SHORT, DEFAULT_BADGE } from './copy'
import { PLACEHOLDERS, withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { leading, TITLE_TRACKING, typography } from './theme'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { BrandingText } from './blocks/BrandingText'
import { FooterLogos } from './blocks/FooterLogos'
import { InfoLine } from './blocks/InfoLine'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterText } from './blocks/PosterText'
import { Sygnet } from './blocks/Sygnet'
import { FadingTriangles } from './blocks/Triangle'
import { Wedges } from './blocks/Wedges'

// WYKŁAD — typografia
export function PosterWyklad({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, event_date, event_time, logoSlots, qrUrl, hidden, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('wyklad', scheme, accent)

  return (
    <PosterFrame vars={cssVars} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <Sygnet name={sygnet} />
        <BrandingText lines={BRANDING_SHORT[lang]} opacity={0.85} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}>
        <Badge background="var(--badge-fill)" color="var(--badge-text)" style={{ fontSize: 24, ...fx('badge') }} field={{ path: 'badge', value: raw.badge, fallback: DEFAULT_BADGE.wyklad[lang], label: 'Etykieta' }} />
        <PosterText
          path="title"
          value={raw.title}
          fallback={PLACEHOLDERS.title}
          multiline
          label="Tytuł"
          style={{ fontSize: 120 * titleScale, fontWeight: 800, lineHeight: leading(0.94, titleScale), letterSpacing: TITLE_TRACKING, fontKerning: 'none', whiteSpace: 'pre-line', ...fx('title') }}
        />
        <PosterText
          path="speaker"
          value={raw.speaker}
          fallback={PLACEHOLDERS.speaker}
          label="Prelegent / organizator"
          style={{ fontSize: 36, fontWeight: 600, color: 'var(--speaker)', ...fx('speaker') }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} style={fx('event_date')} lang={lang} />
          <InfoLine
            parts={[
              { text: event_time, hidden: hidden('event_time') },
              { field: { path: 'location', value: raw.location, fallback: PLACEHOLDERS.location, label: 'Lokalizacja' }, hidden: hidden('location') },
            ]}
            secondLine={{ path: 'subtitle', value: raw.subtitle, multiline: true, label: 'Opis / podtytuł' }}
            secondLineHidden={hidden('subtitle')}
            secondLineStyle={{ fontSize: typography.body.fontSize * textScale, lineHeight: leading(typography.body.lineHeight, textScale), whiteSpace: 'pre' }}
            style={{ paddingBottom: 10, whiteSpace: 'nowrap' }}
          />
        </div>
        <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>

      <Wedges />
      <FadingTriangles width={38} height={32} color="var(--chips)" gap={12} left={18} bottom={72} />
    </PosterFrame>
  )
}
