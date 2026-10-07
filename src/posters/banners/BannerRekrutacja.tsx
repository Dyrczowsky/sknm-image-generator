import { fontMono } from '../theme'
import { sygnetByName } from '../logos'
import { withPlaceholders } from '../fallback'
import { resolveScheme } from '../schemes'
import { getDay, getMonthShort } from '../../utils/formatDate'
import { PosterFrame } from '../blocks/PosterFrame'
import { Badge } from '../blocks/Badge'
import { InfoLine } from '../blocks/InfoLine'
import { BrandingText } from '../blocks/BrandingText'
import { useBannerLayout } from '../shape'
import { BANNER_SYGNET_W, BannerLogos } from './common'
import type { PosterProps } from '../../types'

// Zygzak pasa: głębokość zęba i jego przybliżona szerokość - liczba zębów
// wynika z szerokości ramki, żeby wzór był równie gęsty w obu banerach.
const TOOTH_H = 44
const TOOTH_W = 164

function zigzag(width: number): string {
  const teeth = Math.max(2, Math.round(width / TOOTH_W))
  const points: string[] = []
  for (let i = 0; i <= teeth * 2; i++) {
    points.push(`${((i / (teeth * 2)) * 100).toFixed(3)}% ${i % 2 === 0 ? `${TOOTH_H}px` : '0'}`)
  }
  return `polygon(${points.join(',')},100% 100%,0 100%)`
}

// REKRUTACJA (baner) — duży tytuł, niższy pas z zygzakiem wzdłuż dołu.
export function BannerRekrutacja({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, event_date, event_time, location, badge, graphics, showPkLogo, qrUrl, hidden, fx, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('rekrutacja', scheme, accent)
  const { padX, padY, width } = useBannerLayout()
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} style={{ padding: `${padY}px ${padX}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: BANNER_SYGNET_W, display: 'block' }} />
        <BrandingText lines={lang === 'en' ? ['STUDENT SCIENCE CLUB', 'OF MATHEMATICS', 'KRAKOW UNIVERSITY OF TECHNOLOGY'] : ['STUDENCKIE KOŁO', 'NAUKOWE MATEMATYKÓW', 'POLITECHNIKI KRAKOWSKIEJ']} style={{ fontSize: 18 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        <div style={{ fontSize: 78 * titleScale, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-.045em', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        <div style={{ fontSize: 25 * textScale, fontWeight: 600, lineHeight: 1.3, color: 'var(--sub-color)', maxWidth: 900, ...fx('subtitle') }}>
          {subtitle || (lang === 'en'
            ? 'Seminars, competitions, trips, and our own research projects. Every year of study, every faculty.'
            : 'Seminaria, konkursy, wyjazdy i własne projekty badawcze. Każdy rok studiów, każdy wydział.')}
        </div>
      </div>

      {/* Pas + stopka jako jedna bryła, jak w wersji kwadratowej - tylko niższa. */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32,
          position: 'relative', color: 'var(--footer-text)', background: 'var(--band)',
          margin: `0 -${padX}px -${padY}px`, padding: `${TOOTH_H + 14}px ${padX}px ${padY}px`,
          clipPath: zigzag(width),
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Badge color="var(--badge-color)" style={{ font: `700 19px ${fontMono}`, letterSpacing: '.1em', ...fx('badge') }}>{badge || (lang === 'en' ? 'KICK-OFF MEETING' : 'SPOTKANIE ORGANIZACYJNE')}</Badge>
          <InfoLine
            parts={[
              { text: `${getDay(event_date)} ${getMonthShort(event_date, { lang })}`, hidden: hidden('event_date') },
              { text: event_time, hidden: hidden('event_time') },
              { text: location, hidden: hidden('location') },
            ]}
            style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, fontKerning: 'none', whiteSpace: 'nowrap' }}
          />
          <div style={{ fontSize: 19, fontWeight: 500, opacity: 0.85 }}>sknm.pk.edu.pl · @sknm.pk</div>
        </div>
        <BannerLogos qrUrl={qrUrl} slots={slots} variant={s.logoVariant} />
      </div>
    </PosterFrame>
  )
}
