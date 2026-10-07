import type { PosterProps } from '../types'
import { BRANDING_SHORT, DEFAULT_BADGE, SITE_URL } from './copy'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { fontMono, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { BrandingText } from './blocks/BrandingText'
import { FooterLogos } from './blocks/FooterLogos'
import { PosterFrame } from './blocks/PosterFrame'
import { Sygnet } from './blocks/Sygnet'
import { FadingTriangles } from './blocks/Triangle'
import { Wedges } from './blocks/Wedges'

// KOMUNIKAT ROZSZERZONY — tło z klinami i stosem trójkątów jak Wykład, ale
// z prawdziwym akapitem treści (`body`) pod nagłówkiem. Plakietka, trójkąty
// i podpis niosą kolor akcentu; data w stopce jest opcjonalna (checkbox
// widoczności) — do dłuższych komunikatów, regulaminów, relacji.
export function PosterKomunikat({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { title, subtitle, body, badge, event_date, logoSlots, qrUrl, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('komunikat', scheme, accent)
  const { kx } = usePosterShape()

  return (
    <PosterFrame vars={cssVars} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <Sygnet name={sygnet} />
        <BrandingText lines={BRANDING_SHORT[lang]} opacity={0.85} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 860 * kx, position: 'relative', zIndex: 1 }}>
        <Badge background="var(--accent)" color="var(--badge-text)" style={{ fontSize: 24, ...fx('badge') }}>{badge || DEFAULT_BADGE.komunikat[lang]}</Badge>
        <div style={{ fontSize: 68 * titleScale, fontWeight: 800, lineHeight: 1.05, letterSpacing: TITLE_TRACKING, fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        <div style={{ fontSize: 32 * textScale, fontWeight: 500, lineHeight: 1.5, color: 'var(--muted-text)', whiteSpace: 'pre-wrap', ...fx('body') }}>
          {body}
        </div>
        {subtitle && (
          <div style={{ font: `700 ${22 * textScale}px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)', ...fx('subtitle') }}>— {subtitle.toUpperCase()}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} style={fx('event_date')} lang={lang} />
          <div style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85, paddingBottom: 10 }}>{SITE_URL}</div>
        </div>
        <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>

      <Wedges />
      <FadingTriangles width={38} height={32} color="var(--accent)" gap={12} left={18} bottom={72} />
    </PosterFrame>
  )
}
