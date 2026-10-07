import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { fontMono } from '../theme'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { Triangle } from '../blocks/Triangle'
import { BannerLogos, MarginChips, NAME_TRACKING } from './common'

// OGŁOSZENIE (baner) — wyśrodkowana nazwa koła pod sygnetem.
export function BannerOgloszenie({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('ogloszenie', scheme, accent)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <MarginChips margin={padX - BANNER_PAD} colors={['var(--accent)', 'var(--accent)', 'var(--accent)']} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <Sygnet name={sygnet} width={92} />
        <div style={{ fontSize: 58 * titleScale, fontWeight: 800, lineHeight: 1.04, letterSpacing: NAME_TRACKING, maxWidth: '30ch', textWrap: 'balance', fontKerning: 'none' }}>
          {CLUB_NAME[lang]}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Triangle width={26} height={22} color="var(--accent)" />
          <div style={{ font: `700 ${19 * textScale}px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)' }}>{SITE_URL.toUpperCase()}</div>
          <Triangle width={26} height={22} color="var(--accent)" />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 24 }}>
        <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>
    </PosterFrame>
  )
}
