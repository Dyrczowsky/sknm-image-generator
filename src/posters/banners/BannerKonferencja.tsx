import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { useBannerLayout } from '../shape'
import { fontMono } from '../theme'
import { Badge } from '../blocks/Badge'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { BANNER_SYGNET_W, BannerLogos, NAME_TRACKING } from './common'

// Liczba pustych linii po prawej stronie banera.
const RULES = 4
// Szerokość panelu nagłówka wewnątrz bezpiecznej kolumny.
const PANEL_W = 580

// KONFERENCJA (baner) — panel z nazwą koła po lewej, po prawej puste
// linie jak w programie konferencji.
export function BannerKonferencja({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('konferencja', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ flexDirection: 'row' }}>
      <div style={{ flex: '0 0 auto', width: padX + PANEL_W, boxSizing: 'border-box', background: 'var(--panel)', color: 'var(--panel-text)', padding: `${padY}px 40px ${padY}px ${padX}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge color="var(--header-badge)" style={{ fontSize: 18 }}>SKNM</Badge>
          <div style={{ fontSize: 44 * titleScale, lineHeight: 1.02, fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
            {CLUB_NAME[lang]}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: `${padY}px ${padX}px ${padY}px 40px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        {/* Puste linie w miejscu programu konferencji - sama dekoracja. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 52 }}>
          {Array.from({ length: RULES }, (_, i) => (
            <div key={i} style={{ borderTop: `2px solid ${i === 0 ? 'var(--line-first)' : 'var(--line-rest)'}` }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flex: '0 0 auto' }}>
          <div style={{ font: `700 ${18 * textScale}px ${fontMono}`, letterSpacing: '.12em', color: 'var(--muted-text)', paddingBottom: 6 }}>{SITE_URL}</div>
          <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
        </div>
      </div>
    </PosterFrame>
  )
}
