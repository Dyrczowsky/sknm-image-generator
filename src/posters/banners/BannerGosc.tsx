import type { PosterProps } from '../../types'
import { CLUB_NAME, SITE_URL } from '../copy'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { Badge } from '../blocks/Badge'
import { PosterFrame } from '../blocks/PosterFrame'
import { Sygnet } from '../blocks/Sygnet'
import { PhotoGallery } from '../PhotoGallery'
import { BANNER_SYGNET_W, BannerLogos, NAME_TRACKING } from './common'

// Szerokość zdjęcia wewnątrz bezpiecznej kolumny; na okładce strony zdjęcie
// dodatkowo wychodzi na lewy margines aż do krawędzi.
const PHOTO_W = 360

// GOŚĆ (baner) — zdjęcie na całą wysokość po lewej, nazwa koła po prawej.
export function BannerGosc({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { logoSlots, qrUrl, photos, titleScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('gosc', scheme, accent)
  const { padX, padY, height } = useBannerLayout()

  // Trójkąt z sygnetem rośnie razem z marginesem, żeby sygnet został
  // w bezpiecznej kolumnie, a nie w przycinanym rogu.
  const bleed = padX - BANNER_PAD
  const triW = 300 + bleed
  const triH = Math.min(height, Math.round(300 + bleed * 1.45))

  return (
    <PosterFrame vars={cssVars} style={{ flexDirection: 'row' }}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie</>}
        style={{ width: bleed + PHOTO_W + BANNER_PAD, height: '100%', flex: '0 0 auto' }}
        placeholderStyle={{ paddingLeft: bleed }}
        labelStyle={{ fontSize: 18 }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: triW, height: triH, background: 'var(--sygnet-bg, var(--accent))', clipPath: 'polygon(0 0,100% 0,0 100%)', display: 'flex', alignItems: 'flex-start', padding: `${padY}px 0 0 ${padX}px`, boxSizing: 'border-box' }}>
          <Sygnet name={sygnet} width={BANNER_SYGNET_W} />
        </div>
      </PhotoGallery>

      <div style={{ flex: 1, minWidth: 0, padding: `${padY}px ${padX}px ${padY}px ${BANNER_PAD}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <Badge color="var(--accent)" style={{ fontSize: 18, paddingTop: 6 }}>SKNM</Badge>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 58 * titleScale, lineHeight: 1, fontWeight: 800, letterSpacing: NAME_TRACKING, fontKerning: 'none', textWrap: 'balance' }}>
            {CLUB_NAME[lang]}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)', paddingBottom: 6 }}>{SITE_URL}</div>
          <BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
        </div>
      </div>
    </PosterFrame>
  )
}
