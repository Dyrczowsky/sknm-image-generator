import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL, SOCIAL_HANDLE } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { useBannerLayout } from '../shape'
import { fontMono } from '../theme'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { BANNER_SYGNET_W, BannerLogos, NAME_TRACKING } from './common'

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

// REKRUTACJA (baner) — duża nazwa koła, pas z zygzakiem wzdłuż dołu.
export function BannerRekrutacja({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, titleScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('rekrutacja', scheme, accent)
  const { padX, padY, width } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ fontSize: 72 * titleScale, fontWeight: 800, lineHeight: 0.94, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
          {CLUB_NAME[lang]}
        </div>
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
        <div style={{ font: `700 19px ${fontMono}`, letterSpacing: '.1em', color: 'var(--badge-color)', paddingBottom: 8 }}>{`${SITE_URL} · ${SOCIAL_HANDLE}`}</div>
        <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>
    </PosterFrame>
  )
}
