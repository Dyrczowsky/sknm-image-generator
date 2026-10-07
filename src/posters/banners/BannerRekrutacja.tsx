import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { BrandingText } from '../blocks/BrandingText'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// Zygzak pasa: głębokość zęba i jego przybliżona szerokość - liczba zębów
// wynika z szerokości ramki, żeby wzór był równie gęsty w obu banerach.
const TOOTH_H = 44
const TOOTH_W = 164

function zigzag(width: number): string {
  const teeth = Math.max(2, Math.round(width / TOOTH_W))
  const points: string[] = []
  for (let i = 0; i <= teeth * 2; i++) {
    points.push(`${((i / (teeth * 2)) * 100).toFixed(3)}% ${i % 2 === 0 ? `${TOOTH_H}px` : '0'}`)
  }
  return `polygon(${points.join(',')},100% 100%,0 100%)`
}

// REKRUTACJA (baner) — duża nazwa koła z hasłem, pas z zygzakiem wzdłuż dołu.
export function BannerRekrutacja({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('rekrutacja', scheme, accent)
  const copy = bannerCopy(lang)
  const { padX, padY, width } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <BrandingText lines={['SKNM', ...copy.university.toUpperCase().split(' ')]} style={{ fontSize: 18 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ fontSize: 82 * titleScale, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-.045em', fontKerning: 'none', textWrap: 'balance' }}>
          {copy.name}
        </div>
        <div style={{ fontSize: 24 * textScale, fontWeight: 600, lineHeight: 1.3, color: 'var(--sub-color)', maxWidth: 900 }}>{copy.tagline}</div>
      </div>

      {/* Pas + stopka jako jedna bryła, jak w wersji kwadratowej - tylko niższa. */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32,
          position: 'relative', color: 'var(--footer-text)', background: 'var(--band)',
          margin: `0 -${padX}px -${padY}px`, padding: `${TOOTH_H + 10}px ${padX}px ${padY - 12}px`,
          clipPath: zigzag(width),
        }}
      >
        <div style={{ font: `700 19px ${fontMono}`, letterSpacing: '.1em', color: 'var(--badge-color)', paddingBottom: 8 }}>{BANNER_SITE} · @sknm.pk</div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
