interface TriangleProps {
  width: number
  height: number
  color: string
  opacity?: number
}

// Trójkąt wierzchołkiem w dół - motyw sygnetu powtarzany w dekoracjach.
export function Triangle({ width, height, color, opacity }: TriangleProps) {
  return <div style={{ width, height, background: color, clipPath: 'polygon(0 0,100% 0,50% 100%)', opacity }} />
}

const FADE_STEPS = [undefined, 0.66, 0.33]

interface FadingTrianglesProps extends Omit<TriangleProps, 'opacity'> {
  gap: number
  left: number
  bottom: number
}

// Pionowy stos trzech gasnących trójkątów przy lewej krawędzi plakatu.
export function FadingTriangles({ gap, left, bottom, ...triangle }: FadingTrianglesProps) {
  return (
    <div style={{ position: 'absolute', left, bottom, display: 'flex', flexDirection: 'column', gap }}>
      {FADE_STEPS.map((opacity, i) => (
        <Triangle key={i} {...triangle} opacity={opacity} />
      ))}
    </div>
  )
}
