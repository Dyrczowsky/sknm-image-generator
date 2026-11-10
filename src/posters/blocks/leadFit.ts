import type { CSSProperties } from 'react'
import type { TextInk } from '../../utils/textInk'

// Dopasowanie treści lewego rogu do pasu stopki o wysokości `band`: skala
// (tekst wyższy niż pas maleje, niższy nie rośnie) i ujemne marginesy, po
// których w rzędzie zostaje tylko sam tekst - od wierzchołka liter do linii
// bazowej, w skali. Transformacja nie zmienia układu, więc marginesy zdejmują
// też różnicę między pudełkiem przed i po skalowaniu. Treść bez tekstu
// (trójkąty w „Dacie"): całe pudełko.
//
// `maxWidth` - ile miejsca w rzędzie zostaje obok logotypów w pełnej
// wysokości pasa. Szersza treść maleje dalej, żeby logo nie musiało, ale
// najwyżej do LEAD_MIN_WIDTH_SCALE skali „na wysokość" - dalej maleją logotypy.
export const LEAD_MIN_WIDTH_SCALE = 0.7

export function leadFit(
  box: { width: number; height: number },
  ink: TextInk | null,
  band: number,
  maxWidth?: number,
): { scale: number; style: CSSProperties } {
  const top = ink?.top ?? 0
  const height = ink?.height ?? box.height
  const byHeight = Math.min(1, band / height)
  const byWidth = maxWidth !== undefined && maxWidth > 0 ? maxWidth / box.width : Infinity
  const scale = Math.min(byHeight, Math.max(byHeight * LEAD_MIN_WIDTH_SCALE, byWidth))
  const style: CSSProperties = {
    marginTop: -top * scale,
    marginBottom: (top + height) * scale - box.height,
    marginRight: box.width * (scale - 1),
  }
  if (scale < 1) Object.assign(style, { transform: `scale(${scale})`, transformOrigin: 'left top' })
  return { scale, style }
}
