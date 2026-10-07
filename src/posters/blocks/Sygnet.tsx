import type { CSSProperties } from 'react'
import { sygnetByName } from '../logos'
import type { SygnetName } from '../../types'

// Szerokość sygnetu na plakacie (skala 1080 px).
export const SYGNET_W = 132

interface SygnetProps {
  // Wariant kolorystyczny ze schematu (`resolveScheme(...).sygnet`).
  name?: SygnetName
  width?: number
  style?: CSSProperties
}

// Sygnet SKNM (herb koła) w wariancie wskazanym przez schemat kolorów.
export function Sygnet({ name = 'negatywny', width = SYGNET_W, style }: SygnetProps) {
  return <img src={sygnetByName[name]} alt="SKNM" style={{ width, display: 'block', ...style }} />
}
