import { sygnetByName } from '../logos'
import { resolveScheme } from '../schemes'
import { PhotoGallery } from '../PhotoGallery'
import { withPlaceholders } from '../fallback'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { BANNER_PAD, useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import { BANNER_SITE, bannerCopy } from './copy'
import type { PosterProps } from '../../types'

// Szerokość zdjęcia wewnątrz bezpiecznej kolumny; na okładce strony zdjęcie
// dodatkowo wychodzi na lewy margines aż do krawędzi.
const PHOTO_W = 360

// GOŚĆ (baner) — zdjęcie na całą wysokość po lewej, nazwa koła po prawej.
export function BannerGosc({ data, scheme, accent, lang }: PosterProps) {
  const { graphics, showPkLogo, qrUrl, photos, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('gosc', scheme, accent)
  const copy = bannerCopy(lang)
  const { padX, padY, height } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  const textColor = 'var(--accent)'
  // Trójkąt z sygnetem rośnie razem z marginesem, żeby sygnet został
  // w bezpiecznej kolumnie, a nie w przycinanym rogu.
  const bleed = padX - BANNER_PAD
  const triW = 300 + bleed
  const triH = Math.min(height, Math.round(300 + bleed * 1.45))

  return (
    <PosterFrame vars={s.cssVars} style={{ flexDirection: 'row' }}>
      <PhotoGallery
        photos={photos.photo}
        label={<>zdjęcie</>}
        style={{ width: bleed + PHOTO_W + BANNER_PAD, height: '100%', flex: '0 0 auto' }}
        placeholderStyle={{ paddingLeft: bleed }}
        labelStyle={{ fontSize: 18 }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: triW, height: triH, background: 'var(--sygnet-bg, var(--accent))', clipPath: 'polygon(0 0,100% 0,0 100%)', display: 'flex', alignItems: 'flex-start', padding: `${padY}px 0 0 ${padX}px`, boxSizing: 'border-box' }}>
          <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        </div>
      </PhotoGallery>

      <div style={{ flex: 1, minWidth: 0, padding: `${padY}px ${padX}px ${padY}px ${BANNER_PAD}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
        <Badge color={textColor} style={{ fontSize: 18, paddingTop: 6 }}>SKNM</Badge>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 68 * titleScale, lineHeight: 0.98, fontWeight: 800, letterSpacing: '-.035em', fontKerning: 'none', textWrap: 'balance' }}>
            {copy.name}
          </div>
          <div style={{ fontSize: 28 * textScale, fontWeight: 500, color: 'var(--muted-text)' }}>{copy.university}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: textColor, paddingBottom: 6 }}>{BANNER_SITE}</div>
          <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
        </div>
      </div>
    </PosterFrame>
  )
}
