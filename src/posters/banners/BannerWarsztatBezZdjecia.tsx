import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { PosterText } from '../blocks/PosterText'
import { hasBannerEvent } from './eventLine'
import { usePosterEdit } from '../edit'
import { resolveScheme } from '../schemes'
import { BANNER_PAD, BANNER_SAFE_W, useBannerLayout } from '../shape'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { BANNER_SYGNET_W, BannerFooter, MarginChips, NAME_TRACKING, BannerEventLine, TitleSpacer, TITLE_BLOCK_FLEX } from './common'
import { leading } from '../theme'

// WARSZTAT BEZ ZDJĘCIA (baner) — kolorystyka Warsztatu, ale bez zdjęcia:
// sygnet, nazwa koła i stopka w jednej wyśrodkowanej kolumnie. Nazwa ma całą
// bezpieczną szerokość, więc jest większa niż w wersji ze zdjęciem.
export function BannerWarsztatBezZdjecia({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, logoSlots, qrUrl, qrSide, titleScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('warsztat', scheme, accent)
  const { padX, padY } = useBannerLayout()
  const { editable } = usePosterEdit()

  return (
    <PosterFrame vars={cssVars}>
      <MarginChips margin={padX - BANNER_PAD} colors={['var(--pill-fill)', 'var(--pill-fill)', 'var(--pill-fill)']} />

      <div style={{ position: 'absolute', inset: `${padY}px ${padX}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'center' }}>
        <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
        <TitleSpacer height={48} gap={16} />

        {hasBannerEvent(data, editable) ? (
          <div style={{ flex: TITLE_BLOCK_FLEX, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <PosterText path="bannerTitle" value={raw.bannerTitle} fallback={CLUB_NAME[lang]} multiline label="Tekst banera" style={{ fontSize: 76 * titleScale, lineHeight: leading(0.96, titleScale), maxWidth: BANNER_SAFE_W - 2 * BANNER_PAD, color: 'var(--title)', fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }} />
            <BannerEventLine data={data} lang={lang} />
          </div>
        ) : (
          <PosterText path="bannerTitle" value={raw.bannerTitle} fallback={CLUB_NAME[lang]} multiline label="Tekst banera" style={{ flex: TITLE_BLOCK_FLEX, fontSize: 76 * titleScale, lineHeight: leading(0.96, titleScale), maxWidth: BANNER_SAFE_W - 2 * BANNER_PAD, color: 'var(--title)', fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }} />
        )}

        {/* Pigułka z adresem i stopka w jednym, wyśrodkowanym rzędzie. */}
        <BannerFooter
          qrUrl={qrUrl} qrSide={qrSide} slots={logoSlots} variant={logoVariant}
          rowStyle={{ justifyContent: 'center' }}
          logosStyle={{ flex: '0 1 auto' }}
          lead={<div style={{ background: 'var(--pill-fill)', color: 'var(--pill-text)', fontSize: 22, fontWeight: 700, padding: '9px 15px', flex: '0 0 auto' }}>{SITE_URL}</div>}
        />
      </div>
    </PosterFrame>
  )
}
