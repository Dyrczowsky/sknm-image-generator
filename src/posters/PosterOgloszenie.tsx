import type { PosterProps } from '../types'
import { BRANDING_SHORT, SITE_URL } from './copy'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { fontMono, TITLE_TRACKING } from './theme'
import { BrandingText } from './blocks/BrandingText'
import { FooterLogos } from './blocks/FooterLogos'
import { PosterFrame } from './blocks/PosterFrame'
import { Sygnet } from './blocks/Sygnet'
import { Triangle } from './blocks/Triangle'

// OGŁOSZENIE — wyśrodkowany cytat/komunikat, bez zdjęcia i bez daty.
// Jedyny szablon bez narożnikowego stosu informacji — do krótkich ogłoszeń,
// cytatów i podziękowań.
export function PosterOgloszenie({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { title, subtitle, logoSlots, qrUrl, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('ogloszenie', scheme, accent)

  return (
    <PosterFrame vars={cssVars} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Sygnet name={sygnet} />
        <BrandingText lines={BRANDING_SHORT[lang]} opacity={0.85} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 32 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Triangle width={46} height={40} color="var(--accent)" />
          <Triangle width={46} height={40} color="var(--accent)" />
        </div>
        <div style={{ fontSize: 72 * titleScale, fontWeight: 800, lineHeight: 1.08, letterSpacing: TITLE_TRACKING, maxWidth: '18ch', textWrap: 'balance', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ font: `700 ${24 * textScale}px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)', ...fx('subtitle') }}>— {subtitle.toUpperCase()}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85 }}>{SITE_URL}</div>
        <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>
    </PosterFrame>
  )
}
