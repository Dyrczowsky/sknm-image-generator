import { pkLogoLight, pkLogoDark } from './logos'

// Miejsce na logo w plakacie: pokazuje logo wgrane przez użytkownika
// w formularzu, a w jego braku - domyślne logo PK dobrane pod jasne/ciemne tło.
export function LogoSlot({ logo, variant = 'light', width, height, style }) {
  const src = logo || (variant === 'dark' ? pkLogoDark : pkLogoLight)
  return (
    <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <img src={src} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  )
}
