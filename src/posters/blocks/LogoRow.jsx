// Rząd logo/placeholderów (LogoSlot, PlaceholderBox) ze spójnym odstępem.
export function LogoRow({ gap = 16, alignItems, children, style }) {
  return (
    <div style={{ display: 'flex', gap, alignItems, ...style }}>
      {children}
    </div>
  )
}
