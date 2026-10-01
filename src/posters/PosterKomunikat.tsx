import { fontMono, QR_SLOT_H } from './theme'
import { sygnetByName } from './logos'
import { LogoSlots } from './blocks/LogoSlots'
import { QrSlot } from './blocks/QrSlot'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { PosterFrame } from './blocks/PosterFrame'
import { Badge } from './blocks/Badge'
import { BigDateNumber } from './blocks/BigDateNumber'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'
import type { PosterProps } from '../types'

// KOMUNIKAT ROZSZERZONY — tło z klinami i stosem trójkątów jak Wykład, ale
// z prawdziwym akapitem treści (`body`) pod nagłówkiem. Plakietka, trójkąty
// i podpis niosą kolor akcentu; data w stopce jest opcjonalna (checkbox
// widoczności) — do dłuższych komunikatów, regulaminów, relacji.
export function PosterKomunikat({ data, scheme, accent, lang }: PosterProps) {
  const { title, subtitle, body, badge, event_date, graphics, showPkLogo, qrUrl, fx, titleScale, textScale } = withPlaceholders(data)
  const s = resolveScheme('komunikat', scheme, accent)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={lang === 'en' ? ['SKNM', 'KRAKOW UNIVERSITY', 'OF TECHNOLOGY'] : ['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 860, position: 'relative', zIndex: 1 }}>
        <Badge background="var(--accent)" color="var(--badge-text)" style={{ fontSize: 24, ...fx('badge') }}>{badge || (lang === 'en' ? 'ANNOUNCEMENT' : 'KOMUNIKAT')}</Badge>
        <div style={{ fontSize: 68 * titleScale, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.02em', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        <div style={{ fontSize: 32 * textScale, fontWeight: 500, lineHeight: 1.5, color: 'var(--muted-text)', whiteSpace: 'pre-wrap', ...fx('body') }}>
          {body}
        </div>
        {subtitle && (
          <div style={{ font: `700 ${22 * textScale}px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)', ...fx('subtitle') }}>— {subtitle.toUpperCase()}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
          <BigDateNumber event_date={event_date} style={fx('event_date')} lang={lang} />
          <div style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85, paddingBottom: 10 }}>sknm.pk.edu.pl</div>
        </div>
        <LogoRow minHeight={QR_SLOT_H}>
          <QrSlot value={qrUrl} />
          <LogoSlots slots={slots} variant={s.logoVariant} />
        </LogoRow>
      </div>

      <div style={{ position: 'absolute', top: 0, right: 0, width: 700, height: 600, background: 'var(--wash-top)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920, height: 780, background: 'var(--wedge-br)', opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520, height: 300, background: 'var(--wedge-bl)', clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
      <div style={{ position: 'absolute', left: 18, bottom: 72, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 38, height: 32, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        <div style={{ width: 38, height: 32, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.66 }} />
        <div style={{ width: 38, height: 32, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity: 0.33 }} />
      </div>
    </PosterFrame>
  )
}
