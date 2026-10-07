import { colors, fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { resolveScheme } from '../schemes'
import { withPlaceholders } from '../fallback'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// Szerokość panelu nagłówka wewnątrz bezpiecznej kolumny.
const PANEL_W = 520

// KONFERENCJA (baner) — panel z nazwą koła po lewej, po prawej lista tego,
// czym koło się zajmuje (w miejscu programu konferencji).
export function BannerKonferencja({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('konferencja', scheme, accent)
  const copy = bannerCopy(lang)
  const { padX, padY } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ flexDirection: 'row' }}>
      <div style={{ flex: '0 0 auto', width: padX + PANEL_W, boxSizing: 'border-box', background: 'var(--panel)', color: 'var(--panel-text)', padding: `${padY}px 40px ${padY}px ${padX}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge color="var(--header-badge)" style={{ fontSize: 18 }}>SKNM</Badge>
          <div style={{ fontSize: 46 * titleScale, lineHeight: 1, fontWeight: 800, letterSpacing: '-.035em', fontKerning: 'none', textWrap: 'balance' }}>
            {copy.name}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: `${padY}px ${padX}px ${padY}px 40px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {copy.activities.map((item, i) => (
            <div
              key={item}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr',
                gap: 18,
                padding: '15px 0',
                borderTop: `2px solid ${i === 0 ? 'var(--line-first)' : 'var(--line-rest)'}`,
                alignItems: 'baseline',
              }}
            >
              <div style={{ font: `700 20px ${fontMono}`, color: colors.coral }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontSize: 30 * textScale, fontWeight: 700, lineHeight: 1.15, fontKerning: 'none' }}>{item}</div>
            </div>
          ))}
          <div style={{ borderTop: `2px solid var(--line-rest)` }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flex: '0 0 auto' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--muted-text)', paddingBottom: 6 }}>{BANNER_SITE}</div>
          <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
        </div>
      </div>
    </PosterFrame>
  )
}
