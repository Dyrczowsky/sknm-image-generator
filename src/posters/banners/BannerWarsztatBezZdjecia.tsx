import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { BANNER_PAD, BANNER_SAFE_W, useBannerLayout } from '../shape'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { BANNER_SYGNET_W, BannerLogos, MarginChips, NAME_TRACKING } from './common'
import { leading } from '../theme'

// WARSZTAT BEZ ZDJĘCIA (baner) — kolorystyka Warsztatu, ale bez zdjęcia:
// sygnet, nazwa koła i stopka w jednej wyśrodkowanej kolumnie. Nazwa ma całą
// bezpieczną szerokość, więc jest większa niż w wersji ze zdjęciem.
export function BannerWarsztatBezZdjecia({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, titleScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('warsztat', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars}>
      <MarginChips margin={padX - BANNER_PAD} colors={['var(--pill-fill)', 'var(--pill-fill)', 'var(--pill-fill)']} />

      <div style={{ position: 'absolute', inset: `${padY}px ${padX}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'center' }}>
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />

        <div style={{ fontSize: 76 * titleScale, lineHeight: leading(0.96, titleScale), maxWidth: BANNER_SAFE_W - 2 * BANNER_PAD, color: 'var(--title)', fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
          {CLUB_NAME[lang]}
        </div>

        {/* Pigułka z adresem i stopka w jednym, wyśrodkowanym rzędzie. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 24 }}>
          <div style={{ background: 'var(--pill-fill)', color: 'var(--pill-text)', fontSize: 22, fontWeight: 700, padding: '9px 15px', flex: '0 0 auto' }}>{SITE_URL}</div>
          <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} style={{ flex: '0 1 auto' }} />
        </div>
      </div>
    </PosterFrame>
  )
}
