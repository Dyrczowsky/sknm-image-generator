import { usePosterShape } from '../shape'

// Tło z trzech klinów (Wykład, Komunikat rozszerzony i ich banery): jasna
// mgiełka w prawym górnym rogu oraz kliny w prawym i lewym dolnym. Kolory to
// role `washTop` / `wedgeBr` / `wedgeBl` schematu; kliny rosną z ramką.
// Renderuj PO treści plakatu - treść dostaje `zIndex: 1`, żeby leżeć nad nimi.
export function Wedges() {
  const { kx, ky } = usePosterShape()
  return (
    <>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 700 * kx, height: 600 * ky, background: 'var(--wash-top)', clipPath: 'polygon(0 0,100% 0,100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 920 * kx, height: 780 * ky, background: 'var(--wedge-br)', opacity: 0.42, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 520 * kx, height: 300 * ky, background: 'var(--wedge-bl)', clipPath: 'polygon(0 100%,0 0,100% 100%)' }} />
    </>
  )
}
