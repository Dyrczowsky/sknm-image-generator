import type { PosterProps } from '../types'
import { toPlain } from '../richText'
import { ALUMNI_LABELS, BRANDING_FULL, DEFAULT_BADGE, SITE_URL } from './copy'
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

// ABSOLWENT — jubileusz: duży portret byłego członka koła, kim był w SKNM
// i kim jest dziś; opcjonalnie krótki opis. Paleta Gali (ink + złoto).
export function PosterAbsolwent({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { raw, logoSlots, qrUrl, qrSide, qrPlacement, photos, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('absolwent', scheme, accent)
  const { kx, ky, height } = usePosterShape()
  const hasBody = toPlain(raw.body ?? '') !== ''
  // Portret 4:5 na całą wolną wysokość (430 px = marginesy, nagłówek, stopka),
  // z opisem niższy; nie wyższy niż 640, żeby w pionie nie zjadł kolumny tekstu.
  const photoH = Math.min(640, height - 430 - (hasBody ? 160 : 0))
  const photoW = Math.round(photoH * 0.8)
  const bodySize = 24 * textScale
  const labels = ALUMNI_LABELS[lang]

  const label = (text: string) => (
    <div style={{ font: `700 18px ${fontMono}`, letterSpacing: '.2em', color: 'var(--gold)', marginBottom: 6 }}>{text}</div>
  )
  const role = { fontSize: 30 * textScale, fontWeight: 600, lineHeight: leading(1.3, textScale), whiteSpace: 'pre-line' } as const

  return (
    <PosterFrame vars={cssVars} padding={72} style={{ justifyContent: 'flex-start', gap: 36, position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 880 * kx, height: 700 * ky, background: 'var(--panel-br)', clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flex: '0 0 auto' }}>
        <Sygnet name={sygnet} width={110} />
        <BrandingText lines={BRANDING_FULL[lang]} color="var(--gold)" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 40, position: 'relative', zIndex: 1, flex: '0 1 auto', minHeight: 0 }}>
        {/* Złota ramka odsunięta od zdjęcia - „portret w passe-partout". */}
        <PhotoGallery
          photos={photos.photo}
          label={<>zdjęcie absolwenta<br />{`${photoW} × ${photoH}`}</>}
          style={{ width: photoW, height: photoH, flex: '0 0 auto', outline: '2px solid var(--gold)', outlineOffset: 10, margin: 12 }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Badge color="var(--gold)" style={{ font: `700 20px ${fontMono}`, letterSpacing: '.2em', ...fx('badge') }}
              field={{ path: 'badge', value: raw.badge, fallback: DEFAULT_BADGE.absolwent[lang], label: 'Etykieta' }}
            />
            <PosterText
              path="title"
              value={raw.title}
              fallback={PLACEHOLDERS.absolwentName}
              multiline
              label="Imię i nazwisko"
              style={{ fontSize: 68 * titleScale, fontWeight: 800, lineHeight: leading(0.98, titleScale), letterSpacing: TITLE_TRACKING, fontKerning: 'none', whiteSpace: 'pre-line', ...fx('title') }}
            />
          </div>
          <div style={{ height: 2, width: 64, background: 'var(--gold)' }} />
          <div style={fx('subtitle')}>
            {label(labels.then)}
            <PosterText path="subtitle" value={raw.subtitle} fallback={PLACEHOLDERS.absolwentThen} multiline label="Kim był w SKNM" style={{ ...role, color: 'var(--muted-text)' }} />
          </div>
          <div style={fx('speaker')}>
            {label(labels.now)}
            <PosterText path="speaker" value={raw.speaker} fallback={PLACEHOLDERS.absolwentNow} multiline label="Kim jest dziś" style={role} />
          </div>
        </div>
      </div>

      {/* Opis jest opcjonalny - bez niego portret i role mają całe miejsce. */}
      {hasBody && (
        <PosterAutoFit min={posterFitMin(20, bodySize)} notice={BODY_NOTICE} style={{ flex: '0 1 auto', minHeight: 0, position: 'relative', zIndex: 1 }}>
          <PosterText
            path="body"
            value={raw.body}
            multiline
            label="Opis"
            style={{ fontSize: posterFit(bodySize), fontWeight: 500, lineHeight: leading(1.45, textScale), color: 'var(--muted-text)', whiteSpace: 'pre-wrap', ...fx('body') }}
          />
        </PosterAutoFit>
      )}

      <PosterFooter
        qrUrl={qrUrl} qrSide={qrSide} qrPlacement={qrPlacement} slots={logoSlots} variant={logoVariant}
        style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}
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
