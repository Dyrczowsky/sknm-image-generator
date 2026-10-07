import type { PosterProps } from '../types'
import { getDay, getMonthShort } from '../utils/formatDate'
import { BRANDING_FULL, DEFAULT_BADGE, RECRUITMENT_PITCH, SITE_URL, SOCIAL_HANDLE } from './copy'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { fontMono, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { BrandingText } from './blocks/BrandingText'
import { FooterLogos } from './blocks/FooterLogos'
import { InfoLine } from './blocks/InfoLine'
import { PosterFrame } from './blocks/PosterFrame'
import { Sygnet } from './blocks/Sygnet'

// Górna krawędź dolnej bandy: zygzak z sześciu zębów o głębokości 130 px.
const BAND_ZIGZAG =
  'polygon(0 130px,8.33% 0,16.66% 130px,25% 0,33.33% 130px,41.66% 0,50% 130px,58.33% 0,66.66% 130px,75% 0,83.33% 130px,91.66% 0,100% 130px,100% 100%,0 100%)'

// REKRUTACJA — wzór z sygnetu
export function PosterRekrutacja({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, logoSlots, qrUrl, hidden, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('rekrutacja', scheme, accent)
  const { kx } = usePosterShape()

  return (
    <PosterFrame vars={cssVars} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Sygnet name={sygnet} />
        <BrandingText lines={BRANDING_FULL[lang]} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, position: 'relative', maxWidth: 900 * kx }}>
        <div style={{ fontSize: 150 * titleScale, fontWeight: 800, lineHeight: 0.88, letterSpacing: TITLE_TRACKING, fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        <div style={{ fontSize: 38 * textScale, fontWeight: 600, lineHeight: 1.3, color: 'var(--sub-color)', ...fx('subtitle') }}>
          {subtitle || RECRUITMENT_PITCH[lang]}
        </div>
      </div>

      {/* Pas + stopka jako jedna bryła: górna krawędź to zygzak (dekoracja),
          poniżej dolin lity granat, na którym siedzi tekst stopki. */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32,
          position: 'relative', color: 'var(--footer-text)', background: 'var(--band)',
          margin: '0 -72px -72px', padding: '150px 72px 72px',
          clipPath: BAND_ZIGZAG,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Badge color="var(--badge-color)" style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em', ...fx('badge') }}>{badge || DEFAULT_BADGE.rekrutacja[lang]}</Badge>
          <InfoLine
            parts={[
              { text: `${getDay(event_date)} ${getMonthShort(event_date, { lang })}`, hidden: hidden('event_date') },
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.05, fontKerning: 'none', whiteSpace: 'nowrap' }}
          />
          <div style={{ fontSize: 26, fontWeight: 500, opacity: 0.85 }}>{`${SITE_URL} · ${SOCIAL_HANDLE}`}</div>
        </div>
        <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>
    </PosterFrame>
  )
}
