import { sygnetByName } from '../logos'
import { PhotoGallery } from '../PhotoGallery'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { PosterFrame } from '../blocks/PosterFrame'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// Zdjęcie: tyle wchodzi w bezpieczną kolumnę (reszta to prawy margines),
// a `SLANT` to poziomy bieg skosu lewej krawędzi.
const PHOTO_W = 440
const SLANT = 170

// WARSZTAT (baner) — skośne zdjęcie przy prawej krawędzi, nazwa koła po lewej.
export function BannerWarsztat({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, photos, titleScale, textScale } = withPlaceholders(data)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]
  const s = resolveScheme('warsztat', scheme, accent)
  const copy = bannerCopy(lang)
  const { padX, padY } = useBannerLayout()

  return (
    <PosterFrame vars={s.cssVars}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie</>}
        style={{ position: 'absolute', top: 0, right: 0, width: padX + PHOTO_W, height: '100%', clipPath: `polygon(${SLANT}px 0,100% 0,100% 100%,0 100%)` }}
        placeholderStyle={{ paddingLeft: SLANT / 2 }}
        labelStyle={{ fontSize: 18 }}
      />

      <div style={{ position: 'absolute', inset: `${padY}px ${padX}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
          <div style={{ fontSize: 68 * titleScale, lineHeight: 0.96, color: 'var(--title)', fontWeight: 800, letterSpacing: '-.035em', fontKerning: 'none', textWrap: 'balance' }}>
            {copy.name}
          </div>
          <div style={{ fontSize: 26 * textScale, fontWeight: 500, color: 'var(--muted-text)' }}>{copy.university}</div>
        </div>

        {/* Pigułka i stopka w jednym rzędzie: logo leży na zdjęciu, więc slot
            dostaje tło `slot-bg`, jak w wersji kwadratowej. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          <div style={{ background: 'var(--pill-fill)', color: 'var(--pill-text)', fontSize: 22, fontWeight: 700, padding: '9px 15px', flex: '0 0 auto' }}>{BANNER_SITE}</div>
          <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} slotStyle={{ background: 'var(--slot-bg)' }} />
        </div>
      </div>
    </PosterFrame>
  )
}
