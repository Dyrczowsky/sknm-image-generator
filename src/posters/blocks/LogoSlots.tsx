import type { CSSProperties } from 'react'
import { LogoSlot } from '../LogoSlot'
import type { LogoVariant } from '../../types'

type Side = 't' | 'r' | 'b' | 'l'

interface LogoSlotsProps {
  // Kolejne pozycje w stopce: `null` = domyślne logo PK (fallback),
  // string = data URL wgranej grafiki. Kolejność = kolejność wyświetlania.
  slots: (string | null)[]
  variant?: LogoVariant
  // Strefa ochronna do wyzerowania: stała lista stron albo funkcja
  // (przydatne, gdy tylko skrajny slot dotyka krawędzi plakatu).
  flush?: Side[] | ((index: number, total: number) => Side[])
  slotStyle?: CSSProperties
}

// Renderuje rząd slotów logo z tablicy `slots` - domyślne logo PK i/lub
// hurtowo wgrane grafiki układają się w flexie tak samo jak dawniej pojedyncze
// <LogoSlot>. Pusta tablica => brak dzieci (LogoRow po prostu nic nie rysuje).
export function LogoSlots({ slots, variant, flush, slotStyle }: LogoSlotsProps) {
  return (
    <>
      {slots.map((src, i) => (
        <LogoSlot
          key={i}
          logo={src ? { src, enabled: true } : undefined}
          variant={variant}
          fallback={src === null}
          flush={typeof flush === 'function' ? flush(i, slots.length) : flush}
          style={slotStyle}
        />
      ))}
    </>
  )
}
