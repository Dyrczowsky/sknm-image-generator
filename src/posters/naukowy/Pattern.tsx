// Wektorowe tło: poświata akcentu w rogach, cienka siatka z rozsianymi
// symbolami i kilka dużych krzywych (wykresy funkcji) przez cały plakat.
const GLYPHS: [string, number, number, number][] = [
  ['∑', 28, 40, 34], ['π', 120, 96, 30], ['∫', 60, 150, 36], ['√', 170, 30, 28], ['∞', 190, 170, 32],
]

// Sinusoida o danej amplitudzie/fazie w układzie 0..1000 × 0..1000.
function wave(y: number, amp: number, phase: number): string {
  const pts = Array.from({ length: 41 }, (_, i) => {
    const x = i * 25
    return `${x},${(y + amp * Math.sin(x / 120 + phase)).toFixed(1)}`
  })
  return `M${pts.join(' L')}`
}

export function Pattern() {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      <defs>
        <pattern id="naukowy-pattern" width="240" height="240" patternUnits="userSpaceOnUse">
          <path d="M240 0H0V240" fill="none" stroke="currentColor" strokeWidth="1" />
          {GLYPHS.map(([g, x, y, s]) => (
            <text key={g} x={x} y={y} fontSize={s} fill="currentColor" fontFamily="serif">{g}</text>
          ))}
        </pattern>
        <radialGradient id="naukowy-glow" cx="100%" cy="100%" r="70%">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="naukowy-glow2" cx="0%" cy="15%" r="55%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#naukowy-glow2)" />
      <rect width="100%" height="100%" fill="url(#naukowy-glow)" />
      <rect width="100%" height="100%" fill="url(#naukowy-pattern)" opacity="0.1" />
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%">
        <g fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" opacity="0.18">
          <path d={wave(780, 60, 0)} vectorEffect="non-scaling-stroke" />
          <path d={wave(820, 90, 1.3)} vectorEffect="non-scaling-stroke" />
          <path d={wave(860, 40, 2.6)} vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
    </svg>
  )
}
