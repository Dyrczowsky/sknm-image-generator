import type { PosterProps } from '../types'
import { getDay, getMonthShort } from '../utils/formatDate'
import { BRANDING_EVENT } from './copy'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { fontMono, TITLE_TRACKING, typography } from './theme'
import { BrandingText } from './blocks/BrandingText'
import { FooterLogos } from './blocks/FooterLogos'
import { InfoLine } from './blocks/InfoLine'
import { PosterFrame } from './blocks/PosterFrame'
import { Sygnet } from './blocks/Sygnet'
import { Triangle } from './blocks/Triangle'
import { PhotoGallery } from './PhotoGallery'

const TRIANGLE_COLORS = ['var(--tri1)', 'var(--tri2)', 'var(--tri3)']

// DATA — liczba jako grafika
export function PosterData({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, logoSlots, qrUrl, photos, hidden, fx, titleScale, textScale } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('data', scheme, accent)

  return (
    <PosterFrame vars={cssVars} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <BrandingText lines={BRANDING_EVENT[lang]} style={{ textAlign: 'left' }} />
        <Sygnet name={sygnet} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '-40px 0' }}>
        <div style={{ fontSize: 520, fontWeight: 800, lineHeight: 0.72, letterSpacing: '-.03em', ...fx('event_date') }}>
          {getDay(event_date)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 28, paddingTop: 40 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.9, color: 'var(--month-color)', letterSpacing: TITLE_TRACKING, ...fx('event_date') }}>
            {getMonthShort(event_date, { upperCase: true, lang })}
          </div>
          <div style={{ font: `700 26px ${fontMono}`, letterSpacing: '.1em', ...fx('event_time') }}>{event_time}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
        <PhotoGallery
          photos={photos.photo}
          label={<>zdjęcie<br />z wydarzenia</>}
          style={{ width: 230, height: 230, flex: '0 0 auto', borderRadius: 999 }}
          labelStyle={{ font: `400 18px ${fontMono}` }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 60 * titleScale, fontWeight: 800, lineHeight: 1, letterSpacing: TITLE_TRACKING, color: 'var(--title)', fontKerning: 'none', ...fx('title') }}>
            {title}
          </div>
          <InfoLine
            parts={[{ text: subtitle, hidden: hidden('subtitle') }]}
            partsStyle={{ fontSize: typography.body.fontSize * textScale }}
            secondLine={location}
            secondLineHidden={hidden('location')}
            style={{ color: 'var(--muted-text)', maxWidth: '24ch' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {TRIANGLE_COLORS.map((color) => (
            <Triangle key={color} width={56} height={44} color={color} />
          ))}
        </div>
        <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
      </div>
    </PosterFrame>
  )
}
