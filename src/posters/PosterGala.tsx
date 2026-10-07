import type { PosterProps } from '../types'
import { BRANDING_FULL, DEFAULT_BADGE } from './copy'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { fontMono, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { BrandingText } from './blocks/BrandingText'
import { FooterLogos } from './blocks/FooterLogos'
import { InfoLine } from './blocks/InfoLine'
import { PosterFrame } from './blocks/PosterFrame'
import { Sygnet } from './blocks/Sygnet'

// GALA — złoto na grafitowym
export function PosterGala({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, logoSlots, qrUrl, hidden, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('gala', scheme, accent)
  const { kx, ky } = usePosterShape()

  return (
    <PosterFrame vars={cssVars} padding={72}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880 * kx, height: 700 * ky, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', top: 232, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent 0, var(--gold) 18%, var(--gold) 82%, transparent 100%)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <Sygnet name={sygnet} />
        <BrandingText lines={BRANDING_FULL[lang]} color="var(--gold)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, position: 'relative', zIndex: 1 }}>
        <Badge color="var(--gold)" style={{ font: `700 24px ${fontMono}`, letterSpacing: '.2em', ...fx('badge') }}>{badge || DEFAULT_BADGE.gala[lang]}</Badge>
        <div style={{ fontSize: 126 * titleScale, fontWeight: 800, lineHeight: 0.94, letterSpacing: TITLE_TRACKING, fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 34 * textScale, fontWeight: 500, lineHeight: 1.4, color: 'var(--muted-text)', maxWidth: '26ch', ...fx('subtitle') }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} color="var(--gold)" style={fx('event_date')} lang={lang} />
          <InfoLine
            parts={[
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            style={{ paddingBottom: 10, whiteSpace: 'nowrap' }}
          />
        </div>
        <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>
    </PosterFrame>
  )
}
