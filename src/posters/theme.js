// Wspólne tokeny wizualne wyciągnięte z projektów plakatów SKNM.
export const colors = {
  navy: '#3C459B',
  navyDark: '#2B3276',
  navyLight: '#4A54B4',
  ink: '#16182F',
  inkPanel: '#1D2040',
  cream: '#F4F2ED',
  creamMuted: '#C9C6BC',
  textMuted: '#3A3A46',
  placeholderBorder: '#B7B3A6',
  placeholderText: '#8A8677',
  placeholderBg: '#DCD8CD',
  placeholderBgAlt: '#EFECE4',
  lime: 'oklch(0.88 0.17 106)',
  limeText: '#232A66',
  coral: 'oklch(0.68 0.17 30)',
  gold: '#B8943A',
  goldPanelText: '#F0EDE4',
}

export const fontHeading = "Fieldwork, 'Hanken Grotesk', Helvetica, sans-serif"
export const fontMono = "'Space Mono', monospace"

export const placeholderBoxStyle = {
  boxSizing: 'border-box',
  border: `2px dashed ${colors.placeholderBorder}`,
  display: 'grid',
  placeItems: 'center',
  font: `400 15px ${fontMono}`,
  color: colors.placeholderText,
  textAlign: 'center',
}

export const posterBaseStyle = {
  width: 1080,
  height: 1080,
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  fontFamily: fontHeading,
}
