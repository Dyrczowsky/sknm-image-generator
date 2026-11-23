import type { PosterProps } from '../types'
import { BRANDING_FULL, DEFAULT_BADGE, SITE_URL } from './copy'
import { PLACEHOLDERS, withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { usePosterShape } from './shape'
import { fontMono, leading, TITLE_TRACKING } from './theme'
import { Badge } from './blocks/Badge'
import { BrandingText } from './blocks/BrandingText'
import { PosterAutoFit } from './blocks/PosterAutoFit'
import { posterFit, posterFitMin } from './blocks/posterFit'
import { PosterFooter } from './blocks/PosterFooter'
import { PosterFrame } from './blocks/PosterFrame'
import { PosterText } from './blocks/PosterText'
import { Sygnet } from './blocks/Sygnet'
import { PhotoGallery } from './PhotoGallery'

const BODY_NOTICE = 'Opis nie mieści się — skróć tekst albo zmniejsz rozmiar tytułu lub tekstu.'

// ABSOLWENT — jubileusz: portret byłego członka koła, kim jest dziś i kilka
// zdań o nim. Paleta Gali (ink + złoto), ta sama oś akcentu.
export function PosterAbsolwent({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, logoSlots, qrUrl, qrSide, qrPlacement, photos, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('absolwent', scheme, accent)
  const { kx, ky } = usePosterShape()
  // Portret 4:5; w pionie (A-format) trochę większy, bo jest więcej wysokości.
  const photoH = Math.round(400 * Math.min(ky, 1.25))
  const photoW = Math.round(photoH * 0.8)
  const bodySize = 30 * textScale

  return (
    <PosterFrame vars={cssVars} padding={72} style={{ justifyContent: 'flex-start', gap: 36, position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880 * kx, height: 700 * ky, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flex: '0 0 auto' }}>
        <Sygnet name={sygnet} width={110} />
        <BrandingText lines={BRANDING_FULL[lang]} color="var(--gold)" />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 44, position: 'relative', zIndex: 1, flex: '0 0 auto' }}>
        {/* Złota ramka odsunięta od zdjęcia - „portret w passe-partout". */}
        <PhotoGallery
          photos={photos.photo}
          label={<>zdjęcie absolwenta<br />{`${photoW} × ${photoH}`}</>}
          style={{ width: photoW, height: photoH, flex: '0 0 auto', outline: '2px solid var(--gold)', outlineOffset: 10, margin: 12 }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 12 }}>
          <Badge color="var(--gold)" style={{ font: `700 22px ${fontMono}`, letterSpacing: '.2em', ...fx('badge') }}
            field={{ path: 'badge', value: raw.badge, fallback: DEFAULT_BADGE.absolwent[lang], label: 'Etykieta' }}
          />
          <PosterText
            path="title"
            value={raw.title}
            fallback={PLACEHOLDERS.absolwentName}
            multiline
            label="Imię i nazwisko"
            style={{ fontSize: 76 * titleScale, fontWeight: 800, lineHeight: leading(0.98, titleScale), letterSpacing: TITLE_TRACKING, fontKerning: 'none', whiteSpace: 'pre-line', ...fx('title') }}
          />
          <PosterText
            path="subtitle"
            value={raw.subtitle}
            fallback={PLACEHOLDERS.absolwentRole}
            multiline
            label="Kim jest dziś"
            style={{ fontSize: 28 * textScale, fontWeight: 600, lineHeight: leading(1.35, textScale), color: 'var(--gold)', whiteSpace: 'pre-line', ...fx('subtitle') }}
          />
        </div>
      </div>

      <PosterAutoFit min={posterFitMin(22, bodySize)} notice={BODY_NOTICE} style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: 1 }}>
        <PosterText
          path="body"
          value={raw.body}
          fallback={PLACEHOLDERS.absolwentBody}
          multiline
          label="Opis"
          style={{ fontSize: posterFit(bodySize), fontWeight: 500, lineHeight: leading(1.45, textScale), color: 'var(--muted-text)', whiteSpace: 'pre-wrap', ...fx('body') }}
        />
      </PosterAutoFit>

      <PosterFooter
        qrUrl={qrUrl} qrSide={qrSide} qrPlacement={qrPlacement} slots={logoSlots} variant={logoVariant}
        style={{ position: 'relative', zIndex: 1 }}
        lead={
          <PosterText
            path="badge2"
            value={raw.badge2}
            fallback={SITE_URL}
            label="Linia na dole"
            style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', color: 'var(--gold)', ...fx('badge2') }}
          />
        }
      />
    </PosterFrame>
  )
}
