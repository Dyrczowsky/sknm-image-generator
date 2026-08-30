import { fontMono, LOGO_CLEAR, QR_SLOT_H } from './theme'
import { sygnetByName } from './logos'
import { LogoSlots } from './blocks/LogoSlots'
import { QrSlot } from './blocks/QrSlot'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { PosterFrame } from './blocks/PosterFrame'
import { BrandingText } from './blocks/BrandingText'
import { LogoRow } from './blocks/LogoRow'
import type { PosterProps } from '../types'

// OGŁOSZENIE — wyśrodkowany cytat/komunikat, bez zdjęcia i bez daty.
// Jedyny szablon bez narożnikowego stosu informacji — do krótkich ogłoszeń,
// cytatów i podziękowań.
export function PosterOgloszenie({ data, scheme }: PosterProps) {
  const { title, subtitle, graphics, showPkLogo, qrUrl, fx } = withPlaceholders(data)
  const s = resolveScheme('ogloszenie', scheme)
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} padding={96}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132, display: 'block' }} />
        <BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} opacity={0.85} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 32 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 46, height: 40, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          <div style={{ width: 46, height: 40, background: 'var(--accent)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.02em', maxWidth: '18ch', textWrap: 'balance', fontKerning: 'none', ...fx('title') }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ font: `700 24px ${fontMono}`, letterSpacing: '.1em', color: 'var(--accent)', ...fx('subtitle') }}>— {subtitle.toUpperCase()}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ font: `700 20px ${fontMono}`, letterSpacing: '.12em', opacity: 0.85 }}>sknm.pk.edu.pl</div>
        <LogoRow alignItems="flex-end" gap={LOGO_CLEAR} minHeight={QR_SLOT_H}>
          <QrSlot value={qrUrl} />
          <LogoSlots slots={slots} variant={s.logoVariant} flush={['r', 'b']} />
        </LogoRow>
      </div>
    </PosterFrame>
  )
}
