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

// Wspólna skala typografii dla powtarzających się elementów (blocks/).
// Pojedyncza zmiana tutaj propaguje się do wszystkich szablonów, które
// używają danego bloku.
export const typography = {
  tag: {
    font: `700 22px ${fontMono}`,
    letterSpacing: '.14em',
  },
  branding: {
    font: `700 22px ${fontMono}`,
    letterSpacing: '.16em',
    lineHeight: 1.7,
  },
  bigDay: {
    fontSize: 104,
    fontWeight: 800,
    lineHeight: 0.86,
    letterSpacing: '-.04em',
  },
  bigMonth: {
    fontSize: 44,
    fontWeight: 600,
    letterSpacing: 0,
  },
  bigTime: {
    font: `700 26px ${fontMono}`,
    letterSpacing: '.1em',
  },
  body: {
    fontSize: 30,
    fontWeight: 500,
    lineHeight: 1.4,
  },
}

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
